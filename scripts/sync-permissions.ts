import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../src/server/permissions";
import { normalizePostgresConnectionString } from "../src/server/postgres-url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizePostgresConnectionString(databaseUrl) }) });
const roles = [
  { id: "role_admin", key: "admin", name: "Admin", description: "Administrative area and delegated application management." },
  { id: "role_teacher", key: "teacher", name: "Teacher", description: "Own classes, rosters, sessions, invitations, and attendance." },
  { id: "role_student", key: "student", name: "Student", description: "Classes in which the user is actively enrolled." },
] as const;

try {
  await db.$transaction(async (tx) => {
    for (const role of roles) await tx.role.upsert({ where: { key: role.key }, update: { name: role.name, description: role.description, isSystem: true }, create: { ...role, isSystem: true } });
    for (const permission of PERMISSIONS) await tx.permission.upsert({ where: { key: permission.key }, update: permission, create: permission });
    for (const [roleKey, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await tx.role.findUniqueOrThrow({ where: { key: roleKey } });
      for (const permissionKey of keys) await tx.rolePermission.upsert({ where: { roleId_permissionKey: { roleId: role.id, permissionKey } }, update: {}, create: { roleId: role.id, permissionKey } });
    }
  }, { maxWait: 30_000, timeout: 60_000 });
  console.log(`Synchronized ${PERMISSIONS.length} permission definitions and default role grants`);
} finally { await db.$disconnect(); }
