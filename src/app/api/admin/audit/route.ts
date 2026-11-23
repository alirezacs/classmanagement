import { listAudit } from "@/server/services/admin";
import { protectedRouteError } from "@/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return Response.json(await listAudit(Object.fromEntries(new URL(request.url).searchParams)), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
