import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { db } from "@/server/db";

type AuditDb = PrismaClient | Prisma.TransactionClient;
export async function writeAudit(input: { actorId?: string | null; action: string; targetType: string; targetId: string; details?: Prisma.InputJsonObject }, client: AuditDb = db) {
  return client.auditLog.create({ data: { actorId: input.actorId ?? null, action: input.action, targetType: input.targetType, targetId: input.targetId, ...(input.details ? { details: input.details } : {}) } });
}
