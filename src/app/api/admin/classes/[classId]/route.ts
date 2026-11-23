import { updateAnyClass } from "@/server/services/admin";
import { protectedRouteError } from "@/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: Promise<{ classId: string }> }) { try { const { classId } = await context.params; return Response.json(await updateAnyClass(classId, await request.json()), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
