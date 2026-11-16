import { AccessDeniedError, AuthenticationRequiredError } from "@/server/authorization";
import { RateLimitError } from "@/server/throttle";

export function protectedRouteError(error: unknown): Response {
  if (error instanceof AuthenticationRequiredError) return Response.json({ error: "Authentication required" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  if (error instanceof RateLimitError) return Response.json({ error: "Try again later" }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } });
  if (error instanceof AccessDeniedError) return Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  if (error instanceof Error && error.name === "SessionScheduleError") return Response.json({ error: error.message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  return Response.json({ error: "Request could not be completed" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
}

