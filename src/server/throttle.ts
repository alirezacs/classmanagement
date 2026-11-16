import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/server/db";

export class RateLimitError extends Error { override readonly name = "RateLimitError"; }
export function sourceBucket(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function enforcePersistentThrottle(subject: string, request: Request, limit = 8, windowMs = 15 * 60_000): Promise<void> {
  const key = createHash("sha256").update(`${subject}:${sourceBucket(request)}`).digest("hex");
  const now = new Date();
  await db.$transaction(async (tx) => {
    const existing = await tx.abuseThrottle.findUnique({ where: { key } });
    if (existing?.blockedUntil && existing.blockedUntil > now) throw new RateLimitError();
    const inWindow = existing && now.getTime() - existing.windowStarts.getTime() < windowMs;
    const count = inWindow ? existing.count + 1 : 1;
    const blockedUntil = count > limit ? new Date(now.getTime() + windowMs) : null;
    await tx.abuseThrottle.upsert({
      where: { key },
      create: { key, count, windowStarts: now, blockedUntil },
      update: { count, windowStarts: inWindow ? existing.windowStarts : now, blockedUntil },
    });
    if (blockedUntil) throw new RateLimitError();
  });
}

