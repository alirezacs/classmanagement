import { requireAuthenticatedUser } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";
import { listClassRoster, manuallyEnrollStudent } from "@/server/services/classes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId } = await context.params; const result = await listClassRoster(user.id, classId, Object.fromEntries(new URL(request.url).searchParams)); return Response.json(result, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
export async function POST(request: Request, context: { params: Promise<{ classId: string }> }): Promise<Response> { try { const user = await requireAuthenticatedUser(); const { classId } = await context.params; return Response.json(await manuallyEnrollStudent(user.id, classId, await request.json()), { status: 201, headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
