-- Attendance is modeled as class segments: Entracte count N creates N + 1
-- attendance checkpoints. Existing legacy moments remain for compatibility.
ALTER TYPE "AttendanceMoment" ADD VALUE IF NOT EXISTS 'SEGMENT';
ALTER INDEX IF EXISTS "Attendance_classSessionId_enrollmentId_moment_entracteNumber_key" RENAME TO "Attendance_classSessionId_enrollmentId_moment_segmentNumber_key";
