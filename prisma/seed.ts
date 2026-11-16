import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEVELOPMENT_SEED !== "true") {
  throw new Error("Development seed is disabled in production");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

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
    for (const user of users) {
      await tx.user.upsert({ where: { id: user.id }, update: { name: user.name }, create: { ...user, emailVerified: true } });
    }

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
  });
}

seed().finally(async () => db.$disconnect());

