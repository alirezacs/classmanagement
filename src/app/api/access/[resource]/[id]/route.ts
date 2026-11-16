import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser, requireSessionAccess } from "@/server/authorization";
import { protectedRouteError } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resourceSchema = z.enum(["sessions"]);

export async function GET(_: NextRequest, context: { params: Promise<{ resource: string; id: string }> }): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser();
    const { resource, id } = await context.params;
    resourceSchema.parse(resource);
    const entity = await requireSessionAccess(user.id, id);
    return Response.json({ id: entity.id }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return protectedRouteError(error); }
}

