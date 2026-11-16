-- Removes the PUBLISHED session state and adds cancellation explanations plus
-- per-Entracte attendance checkpoints. Existing PUBLISHED sessions are retained
-- as DRAFT/scheduled sessions; no attendance rows are deleted.
CREATE TYPE "ClassSessionStatus_new" AS ENUM ('DRAFT', 'CANCELLED', 'COMPLETED');
ALTER TABLE "ClassSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ClassSession" ALTER COLUMN "status" TYPE "ClassSessionStatus_new" USING (CASE WHEN "status"::text = 'PUBLISHED' THEN 'DRAFT' ELSE "status"::text END::"ClassSessionStatus_new");
DROP TYPE "ClassSessionStatus";
ALTER TYPE "ClassSessionStatus_new" RENAME TO "ClassSessionStatus";
ALTER TABLE "ClassSession" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "ClassSession" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "entracteCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "ClassSession" SET "cancellationReason" = 'Cancelled before a reason was recorded' WHERE "status" = 'CANCELLED' AND ("cancellationReason" IS NULL OR length(trim("cancellationReason")) = 0);

CREATE TYPE "AttendanceMoment" AS ENUM ('SESSION', 'BEFORE_ENTRACTE', 'AFTER_ENTRACTE');
ALTER TABLE "Attendance" ADD COLUMN "moment" "AttendanceMoment" NOT NULL DEFAULT 'SESSION';
ALTER TABLE "Attendance" ADD COLUMN "entracteNumber" INTEGER NOT NULL DEFAULT 0;
DROP INDEX IF EXISTS "Attendance_classSessionId_enrollmentId_key";
CREATE UNIQUE INDEX "Attendance_classSessionId_enrollmentId_moment_entracteNumber_key" ON "Attendance"("classSessionId", "enrollmentId", "moment", "entracteNumber");
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_entracteCount_nonnegative_check" CHECK ("entracteCount" >= 0);
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_cancel_reason_check" CHECK ("status" <> 'CANCELLED' OR length(trim("cancellationReason")) > 0);
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_entracteNumber_nonnegative_check" CHECK ("entracteNumber" >= 0);
