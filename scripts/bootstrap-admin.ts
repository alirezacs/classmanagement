import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const emailArg = process.argv.find((value) => value.startsWith("--email="))?.slice("--email=".length) ?? process.env.BOOTSTRAP_ADMIN_EMAIL;
if (!emailArg) throw new Error("Select an existing user with --email=user@example.com or BOOTSTRAP_ADMIN_EMAIL");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const email = emailArg.trim().toLowerCase();
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email } });
    if (!user) throw new Error(`No existing user has email ${email}`);
    if (user.disabledAt) throw new Error("The selected user is deactivated");
    const role = await tx.role.findUnique({ where: { key: "admin" } });
    if (!role) throw new Error("Admin role is missing; run npm run db:seed first");
    await tx.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id, assignedById: user.id } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "role.bootstrap", targetType: "User", targetId: user.id, details: { role: "admin" } } });
    return user;
  }, { isolationLevel: "Serializable" });
  console.log(`Admin access assigned to ${result.email} (${result.id})`);
} finally {
  await db.$disconnect();
}
