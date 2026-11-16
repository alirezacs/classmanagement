import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { requireAuthenticatedUser, requireClassOwner } from "@/server/authorization";
import { db } from "@/server/db";
import { protectedRouteError } from "@/server/http";
import { enforcePersistentThrottle } from "@/server/throttle";
import { sendTransactionalEmail } from "@/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const inputSchema = z.object({ email: z.string().email().max(320) });

export async function GET(request: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId } = await context.params; await requireClassOwner(user.id, classId); const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get("page") ?? 1)); const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20))); const [items, total] = await db.$transaction([db.invitation.findMany({ where: { classId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, intendedRecipientEmail: true, status: true, expiresAt: true, acceptedAt: true, revokedAt: true, createdAt: true } }), db.invitation.count({ where: { classId } })]); return Response.json({ items, page, pageSize, total }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> {
  try {
    await enforcePersistentThrottle("invite-create", request, 12);
    const user = await requireAuthenticatedUser();
    const { classId } = await context.params;
    const classRecord = await requireClassOwner(user.id, classId);
    if (classRecord.status === "ARCHIVED") return Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const { email } = inputSchema.parse(await request.json());
    const token = randomBytes(32).toString("base64url");
    const recipient = email.trim().toLowerCase();
    const invitation = await db.invitation.create({ data: { classId, invitedById: user.id, intendedRecipientEmail: recipient, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000) } });
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    await sendTransactionalEmail({ to: recipient, subject: "You are invited to Classroom", text: `Use this invitation before it expires: ${new URL(`/invite/${token}`, baseUrl)}` });
    return Response.json({ id: invitation.id, expiresAt: invitation.expiresAt, link: new URL(`/invite/${token}`, baseUrl).toString() }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return protectedRouteError(error); }
}

