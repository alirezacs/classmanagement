import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  const migration = await readFile(new URL("../prisma/migrations/20261115010000_initial/migration.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(`INSERT INTO "User" (id,name,email,"emailVerified",locale,"createdAt","updatedAt") VALUES ('teacher-a','Teacher A','teacher-a@example.test',true,'en',now(),now()),('student-a','Student A','student-a@example.test',true,'en',now(),now()); INSERT INTO "Class" (id,"ownerId",title,status,"timeZone","createdAt","updatedAt") VALUES ('class-a','teacher-a','Class A','ACTIVE','UTC',now(),now()); INSERT INTO "Enrollment" (id,"classId","studentId",status,"enrolledAt","createdAt","updatedAt") VALUES ('enrollment-a','class-a','student-a','ACTIVE',now(),now(),now()); INSERT INTO "ClassSession" (id,"classId",title,sequence,"startsAt","endsAt",status,"createdAt","updatedAt") VALUES ('session-a','class-a','Session A',1,now(),now()+interval '1 hour','DRAFT',now(),now());`);
});

describe("remaining database invariants", () => {
  it("enforces unique enrollment and attendance", async () => {
    await expect(db.exec(`INSERT INTO "Enrollment" (id,"classId","studentId",status,"enrolledAt","createdAt","updatedAt") VALUES ('duplicate','class-a','student-a','ACTIVE',now(),now(),now())`)).rejects.toThrow();
    await db.exec(`INSERT INTO "Attendance" (id,"classId","classSessionId","enrollmentId",status,"createdAt","updatedAt") VALUES ('attendance-a','class-a','session-a','enrollment-a','PRESENT',now(),now())`);
    await expect(db.exec(`INSERT INTO "Attendance" (id,"classId","classSessionId","enrollmentId",status,"createdAt","updatedAt") VALUES ('attendance-duplicate','class-a','session-a','enrollment-a','ABSENT',now(),now())`)).rejects.toThrow();
  });
  it("rejects cross-class attendance references", async () => {
    await db.exec(`INSERT INTO "User" (id,name,email,"emailVerified",locale,"createdAt","updatedAt") VALUES ('student-b','Student B','student-b@example.test',true,'en',now(),now()); INSERT INTO "Class" (id,"ownerId",title,status,"timeZone","createdAt","updatedAt") VALUES ('class-b','teacher-a','Class B','ACTIVE','UTC',now(),now()); INSERT INTO "Enrollment" (id,"classId","studentId",status,"enrolledAt","createdAt","updatedAt") VALUES ('enrollment-b','class-b','student-b','ACTIVE',now(),now(),now());`);
    await expect(db.exec(`INSERT INTO "Attendance" (id,"classId","classSessionId","enrollmentId",status,"createdAt","updatedAt") VALUES ('cross-attendance','class-a','session-a','enrollment-b','PRESENT',now(),now())`)).rejects.toThrow();
  });
});
