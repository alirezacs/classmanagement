import { z } from "zod";
import { requireAuthenticatedUser } from "@/server/authorization";
import { createClass, listOwnedClasses, listStudentClasses } from "@/server/services/classes";
import { protectedRouteError } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> { try { const user = await requireAuthenticatedUser(); const url = new URL(request.url); const query = Object.fromEntries(url.searchParams); const scope = z.enum(["owned", "enrolled"]).default("owned").parse(url.searchParams.get("scope") ?? undefined); const result = scope === "enrolled" ? await listStudentClasses(user.id, query) : await listOwnedClasses(user.id, query); return Response.json(result, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }

export async function POST(request: Request): Promise<Response> { try { const user = await requireAuthenticatedUser(); const result = await createClass(user.id, await request.json()); return Response.json({ id: result.id, title: result.title, status: result.status }, { status: 201, headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return protectedRouteError(error); } }
