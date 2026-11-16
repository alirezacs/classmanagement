export const dynamic = "force-dynamic";
export function GET(): Response { return Response.json({ status: "ok", service: "class-management" }, { headers: { "Cache-Control": "no-store" } }); }

