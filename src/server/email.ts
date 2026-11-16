import "server-only";
import { randomUUID } from "node:crypto";

interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export class EmailDeliveryError extends Error { override readonly name = "EmailDeliveryError"; }
export interface LocalEmailMessage { readonly id: string; readonly to: string; readonly subject: string; readonly text: string; readonly createdAt: string; }
const localMailbox = new Map<string, LocalEmailMessage>();

function sanitizeProviderDescription(value: string): string {
  return value.replace(/https?:\/\/\S+/gi, "[redacted-url]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/[A-Za-z0-9_-]{32,}/g, "[redacted-token]").replace(/\s+/g, " ").trim().slice(0, 240) || "provider returned no details";
}

export function listLocalEmailMessages(): LocalEmailMessage[] { return [...localMailbox.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }

function storeLocalEmail(message: EmailMessage): void { const id = randomUUID(); localMailbox.set(id, { id, ...message, createdAt: new Date().toISOString() }); }

/** Server-only Resend transport. Local mode is process-local and development-only. */
export async function sendTransactionalEmail(message: EmailMessage): Promise<void> {
  const mode = process.env.EMAIL_MODE ?? (process.env.NODE_ENV === "production" ? "resend" : "local");
  if (mode === "local") { if (process.env.NODE_ENV === "production") throw new EmailDeliveryError("Local email mode is not available in production"); storeLocalEmail(message); return; }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new EmailDeliveryError("Resend email delivery is not configured (RESEND_API_KEY and EMAIL_FROM are required)");
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    const description = sanitizeProviderDescription(error instanceof Error ? error.message : String(error));
    throw new EmailDeliveryError(`Email provider request failed: ${description}`);
  }
  if (!response.ok) { let description = "provider returned no details"; try { const payload = await response.json() as { message?: unknown; error?: unknown; name?: unknown }; const candidate = [payload.message, payload.error, payload.name].find((item): item is string => typeof item === "string"); if (candidate) description = sanitizeProviderDescription(candidate); } catch { /* deliberately omit non-JSON provider bodies */ } throw new EmailDeliveryError(`Email provider rejected request (HTTP ${response.status}): ${description}`); }
}

