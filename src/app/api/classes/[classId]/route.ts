import { requireAuthenticatedUser } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";
import { requireClassAccess } from "@/server/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser();
    const { classId } = await context.params;
    const access = await requireClassAccess(user.id, classId);
    return Response.json({ id: access.classRecord.id, title: access.classRecord.title, description: access.classRecord.description, status: access.classRecord.status, timeZone: access.classRecord.timeZone, role: access.role }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return protectedRouteError(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> { try { const { updateOwnedClass } = await import("@/server/services/classes"); const user = await requireAuthenticatedUser(); const { classId } = await context.params; const result = await updateOwnedClass(user.id, classId, await request.json()); return Response.json({ id: result.id, title: result.title, status: result.status }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }

