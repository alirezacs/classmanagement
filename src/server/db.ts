import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrlForBuildOrRuntime } from "@/server/env";

const globalDatabase = globalThis as typeof globalThis & { classManagementPool?: Pool; classManagementPrisma?: PrismaClient };
const pool = globalDatabase.classManagementPool ?? new Pool({ connectionString: databaseUrlForBuildOrRuntime(), max: 5 });
attachDatabasePool(pool);
export const db = globalDatabase.classManagementPrisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalDatabase.classManagementPool = pool;
  globalDatabase.classManagementPrisma = db;
}

