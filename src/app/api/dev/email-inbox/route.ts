import { listLocalEmailMessages } from "@/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(): Promise<Response> { if (process.env.NODE_ENV === "production" || (process.env.EMAIL_MODE ?? "local") !== "local") return Response.json({ error: "Unavailable" }, { status: 404, headers: { "Cache-Control": "no-store" } }); return Response.json({ messages: listLocalEmailMessages() }, { headers: { "Cache-Control": "no-store" } }); }
