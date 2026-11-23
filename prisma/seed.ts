import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "@better-auth/utils/password";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../src/server/permissions";
import { normalizePostgresConnectionString } from "../src/server/postgres-url";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEVELOPMENT_SEED !== "true") {
  throw new Error("Development seed is disabled in production");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed");
const initialAdminEmail = (process.env.SEED_ADMIN_EMAIL ?? "alirezam.p90000@gmail.com").trim().toLowerCase();
const initialAdminPassword = process.env.SEED_ADMIN_PASSWORD;
if (!initialAdminPassword || initialAdminPassword.length < 8) throw new Error("SEED_ADMIN_PASSWORD must contain at least 8 characters");
const initialAdminPasswordHash = await hashPassword(initialAdminPassword);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizePostgresConnectionString(databaseUrl) }) });

const users = [
  { id: "seed_teacher_ada", name: "Ada Morgan", email: "ada.teacher@example.test" },
  { id: "seed_teacher_samir", name: "Samir Haddad", email: "samir.teacher@example.test" },
  { id: "seed_student_maya", name: "Maya Chen", email: "maya.student@example.test" },
  { id: "seed_student_noah", name: "Noah Williams", email: "noah.student@example.test" },
  { id: "seed_student_leila", name: "Leila Rahimi", email: "leila.student@example.test" },
  { id: "seed_student_omar", name: "Omar Aziz", email: "omar.student@example.test" },
] as const;

async function seed() {
  await db.$transaction(async (tx) => {
    const roleDefinitions = [
      { id: "role_admin", key: "admin", name: "Admin", description: "Administrative area and delegated application management." },
      { id: "role_teacher", key: "teacher", name: "Teacher", description: "Own classes, rosters, sessions, invitations, and attendance." },
      { id: "role_student", key: "student", name: "Student", description: "Classes in which the user is actively enrolled." },
    ] as const;
    for (const role of roleDefinitions) await tx.role.upsert({ where: { key: role.key }, update: { name: role.name, description: role.description, isSystem: true }, create: { ...role, isSystem: true } });
    for (const permission of PERMISSIONS) await tx.permission.upsert({ where: { key: permission.key }, update: { resource: permission.resource, action: permission.action, description: permission.description, sensitive: permission.sensitive ?? false }, create: { ...permission, sensitive: permission.sensitive ?? false } });
    for (const [roleKey, permissionKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await tx.role.findUniqueOrThrow({ where: { key: roleKey } });
      for (const permissionKey of permissionKeys) await tx.rolePermission.upsert({ where: { roleId_permissionKey: { roleId: role.id, permissionKey } }, update: {}, create: { roleId: role.id, permissionKey } });
    }
    for (const user of users) {
      await tx.user.upsert({ where: { id: user.id }, update: { name: user.name }, create: { ...user, emailVerified: true } });
    }
    const initialAdmin = await tx.user.upsert({
      where: { email: initialAdminEmail },
      update: { name: "Alireza", emailVerified: true, disabledAt: null, disabledReason: null },
      create: { id: "seed_admin_alireza", name: "Alireza", email: initialAdminEmail, emailVerified: true },
    });
    await tx.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: initialAdmin.id } },
      update: { userId: initialAdmin.id, password: initialAdminPasswordHash },
      create: { userId: initialAdmin.id, accountId: initialAdmin.id, providerId: "credential", password: initialAdminPasswordHash },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: initialAdmin.id, roleId: "role_admin" } },
      update: {},
      create: { userId: initialAdmin.id, roleId: "role_admin", assignedById: initialAdmin.id },
    });

    await tx.class.upsert({
      where: { id: "seed_class_physics" },
      update: { title: "Foundations of Physics", ownerId: users[0].id },
      create: { id: "seed_class_physics", ownerId: users[0].id, title: "Foundations of Physics", description: "Mechanics, measurement, and scientific reasoning.", status: "ACTIVE", timeZone: "Asia/Tehran", startsOn: new Date("2026-09-01T00:00:00.000Z"), endsOn: new Date("2027-01-20T00:00:00.000Z") },
    });
    await tx.class.upsert({
      where: { id: "seed_class_writing" },
      update: { title: "Academic Writing Studio", ownerId: users[1].id },
      create: { id: "seed_class_writing", ownerId: users[1].id, title: "Academic Writing Studio", description: "Research, structure, revision, and peer review.", status: "ACTIVE", timeZone: "Europe/London", startsOn: new Date("2026-09-10T00:00:00.000Z"), endsOn: new Date("2027-02-10T00:00:00.000Z") },
    });

    const roster = [
      ["seed_class_physics", users[2].id], ["seed_class_physics", users[3].id], ["seed_class_physics", users[4].id],
      ["seed_class_writing", users[3].id], ["seed_class_writing", users[4].id], ["seed_class_writing", users[5].id],
    ] as const;
    for (const [classId, studentId] of roster) {
      await tx.enrollment.upsert({ where: { classId_studentId: { classId, studentId } }, update: { status: "ACTIVE" }, create: { classId, studentId, status: "ACTIVE" } });
    }
    for (const teacher of users.slice(0, 2)) await tx.userRole.upsert({ where: { userId_roleId: { userId: teacher.id, roleId: "role_teacher" } }, update: {}, create: { userId: teacher.id, roleId: "role_teacher" } });
    for (const student of users.slice(2)) await tx.userRole.upsert({ where: { userId_roleId: { userId: student.id, roleId: "role_student" } }, update: {}, create: { userId: student.id, roleId: "role_student" } });
  });
}

seed().finally(async () => db.$disconnect());

