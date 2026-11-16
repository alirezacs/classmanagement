import { requireAuthenticatedUser } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";
import { getMyAttendance, saveAttendance } from "@/server/services/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ classId: string; sessionId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId, sessionId } = await context.params; const rows = await getMyAttendance(user.id, classId); return Response.json(rows.filter((row) => row.classSessionId === sessionId), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
export async function PUT(request: Request, context: { params: Promise<{ classId: string; sessionId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId, sessionId } = await context.params; const body = await request.json() as { records?: unknown }; return Response.json({ items: await saveAttendance(user.id, classId, sessionId, body.records) }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
