import { requireAuthenticatedUser, requireClassScopedPermission } from "@/server/authorization";
import { db } from "@/server/db";
import { protectedRouteError } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId } = await context.params; await requireClassScopedPermission(user.id, classId, "attendance.manage.own", "attendance.manage.any"); const rows = await db.attendance.groupBy({ by: ["status"], where: { classId }, _count: { _all: true } }); return Response.json({ summary: Object.fromEntries(rows.map((row) => [row.status, row._count._all])) }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
