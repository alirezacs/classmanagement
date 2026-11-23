import { createRole, listRoles } from "@/server/services/admin";
import { protectedRouteError } from "@/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { return Response.json({ items: await listRoles() }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
export async function POST(request: Request) { try { return Response.json(await createRole(await request.json()), { status: 201, headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
