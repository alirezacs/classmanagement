import { requireAuthenticatedUser } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";
import { updateSession } from "@/server/services/sessions";

export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ classId: string; sessionId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId, sessionId } = await context.params; return Response.json(await updateSession(user.id, classId, sessionId, await request.json()), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
