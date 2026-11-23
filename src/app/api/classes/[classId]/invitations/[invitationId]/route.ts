import { requireAuthenticatedUser, requireClassScopedPermission } from "@/server/authorization";
import { db } from "@/server/db";
import { protectedRouteError } from "@/server/http";

export const runtime = "nodejs";
export async function DELETE(_: Request, context: { params: Promise<{ classId: string; invitationId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId, invitationId } = await context.params; const classRecord = await requireClassScopedPermission(user.id, classId, "invitations.manage.own", "invitations.manage.any"); if (classRecord.status === "ARCHIVED") return Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } }); const result = await db.invitation.updateMany({ where: { id: invitationId, classId, status: "PENDING" }, data: { status: "REVOKED", revokedAt: new Date() } }); if (result.count !== 1) return Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } }); return Response.json({ revoked: true }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
