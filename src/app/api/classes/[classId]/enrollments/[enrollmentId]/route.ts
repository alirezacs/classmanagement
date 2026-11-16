import { requireAuthenticatedUser } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";
import { removeEnrollment } from "@/server/services/classes";

export const runtime = "nodejs";
export async function DELETE(_: Request, context: { params: Promise<{ classId: string; enrollmentId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId, enrollmentId } = await context.params; const result = await removeEnrollment(user.id, classId, enrollmentId); if (result.count !== 1) return Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } }); return Response.json({ removed: true }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
