-- Repair accounts enrolled before manual enrollment consistently assigned RBAC roles.
INSERT INTO "UserRole" ("userId", "roleId")
SELECT DISTINCT enrollment."studentId", role."id"
FROM "Enrollment" AS enrollment
CROSS JOIN "Role" AS role
WHERE enrollment."status" = 'ACTIVE'
  AND role."key" = 'student'
ON CONFLICT ("userId", "roleId") DO NOTHING;
