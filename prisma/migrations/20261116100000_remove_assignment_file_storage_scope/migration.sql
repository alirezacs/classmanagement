-- Destructive scope reduction: permanently removes assignment, submission, grade,
-- file metadata, folder, attachment, and storage-connection records. External
-- provider objects are not touched by this migration.
DROP TABLE IF EXISTS "UploadPart" CASCADE;
DROP TABLE IF EXISTS "UploadSession" CASCADE;
DROP TABLE IF EXISTS "StorageConnection" CASCADE;
DROP TABLE IF EXISTS "SubmissionAttachment" CASCADE;
DROP TABLE IF EXISTS "AssignmentAttachment" CASCADE;
DROP TABLE IF EXISTS "SessionMaterialAttachment" CASCADE;
DROP TABLE IF EXISTS "ClassMaterialAttachment" CASCADE;
DROP TABLE IF EXISTS "FileAsset" CASCADE;
DROP TABLE IF EXISTS "Folder" CASCADE;
DROP TABLE IF EXISTS "Grade" CASCADE;
DROP TABLE IF EXISTS "Submission" CASCADE;
DROP TABLE IF EXISTS "Assignment" CASCADE;
DROP TYPE IF EXISTS "UploadSessionState";
DROP TYPE IF EXISTS "StorageConnectionStatus";
DROP TYPE IF EXISTS "StorageProviderKind";
DROP TYPE IF EXISTS "FileLifecycleState";
DROP TYPE IF EXISTS "GradeState";
DROP TYPE IF EXISTS "SubmissionState";
DROP TYPE IF EXISTS "PublicationState";
