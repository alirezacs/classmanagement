import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

describe("RBAC forward migration", () => {
  it("preserves users and maps existing ownership and enrollment access", async () => {
    const database = new PGlite();
    const root = new URL("../prisma/migrations/", import.meta.url);
    const directories = (await readdir(root)).filter((name) => /^\d/.test(name)).sort();
    for (const directory of directories.filter((name) => name < "20261117100000_rbac_admin_audit")) {
      await database.exec(await readFile(new URL(`${directory}/migration.sql`, root), "utf8"));
    }
    await database.exec(`
      INSERT INTO "User" (id,name,email,"emailVerified",locale,"createdAt","updatedAt") VALUES
        ('existing-teacher','Existing Teacher','teacher@example.test',true,'en',now(),now()),
        ('existing-student','Existing Student','student@example.test',true,'en',now(),now());
      INSERT INTO "Class" (id,"ownerId",title,status,"timeZone","createdAt","updatedAt") VALUES
        ('existing-class','existing-teacher','Existing class','ACTIVE','UTC',now(),now());
      INSERT INTO "Enrollment" (id,"classId","studentId",status,"enrolledAt","createdAt","updatedAt") VALUES
        ('existing-enrollment','existing-class','existing-student','ACTIVE',now(),now(),now());
    `);
    await database.exec(await readFile(new URL("20261117100000_rbac_admin_audit/migration.sql", root), "utf8"));
    const roles = await database.query<{ key: string }>(`SELECT key FROM "Role" ORDER BY key`);
    const mapped = await database.query<{ userId: string; key: string }>(`SELECT ur."userId", r.key FROM "UserRole" ur JOIN "Role" r ON r.id=ur."roleId" ORDER BY ur."userId"`);
    expect(roles.rows.map((row) => row.key)).toEqual(["admin", "student", "teacher"]);
    expect(mapped.rows).toEqual([{ userId: "existing-student", key: "student" }, { userId: "existing-teacher", key: "teacher" }]);
    await database.close();
  });
});
