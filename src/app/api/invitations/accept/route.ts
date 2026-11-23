import { createHash } from "node:crypto";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/server/authorization";
import { db } from "@/server/db";
import { protectedRouteError } from "@/server/http";
import { enforcePersistentThrottle } from "@/server/throttle";

export const runtime = "nodejs";
const inputSchema = z.object({ token: z.string().min(32).max(512) });
const invalidInvitation = () => Response.json({ error: "Invitation cannot be accepted" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(request: Request): Promise<Response> {
  try {
    await enforcePersistentThrottle("invite-accept", request, 8);
    const user = await requireAuthenticatedUser();
    const { token } = inputSchema.parse(await request.json());
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({ where: { tokenHash, status: "PENDING", expiresAt: { gt: now }, intendedRecipientEmail: normalizeEmail(user.email), class: { status: { not: "ARCHIVED" } } } });
      if (!invitation) return false;
      const consumed = await tx.invitation.updateMany({ where: { id: invitation.id, status: "PENDING", acceptedAt: null, revokedAt: null }, data: { status: "ACCEPTED", acceptedAt: now } });
      if (consumed.count !== 1) return false;
      await tx.enrollment.upsert({ where: { classId_studentId: { classId: invitation.classId, studentId: user.id } }, update: { status: "ACTIVE", withdrawnAt: null, enrolledAt: now }, create: { classId: invitation.classId, studentId: user.id, status: "ACTIVE", enrolledAt: now } });
      const studentRole = await tx.role.findUnique({ where: { key: "student" }, select: { id: true } });
      if (studentRole) await tx.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: studentRole.id } }, update: {}, create: { userId: user.id, roleId: studentRole.id } });
      return true;
    }, { isolationLevel: "Serializable" });
    return result ? Response.json({ accepted: true }, { headers: { "Cache-Control": "private, no-store" } }) : invalidInvitation();
  } catch (error) { return protectedRouteError(error); }
}

