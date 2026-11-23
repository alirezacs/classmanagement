import { createUser, listUsers } from "@/server/services/admin";
import { protectedRouteError } from "@/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return Response.json(await listUsers(Object.fromEntries(new URL(request.url).searchParams)), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
export async function POST(request: Request) { try { return Response.json(await createUser(await request.json()), { status: 201, headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
