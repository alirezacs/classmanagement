-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('INVITED', 'ACTIVE', 'WITHDRAWN', 'REMOVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClassSessionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionState" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "GradeState" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FileLifecycleState" AS ENUM ('PENDING_UPLOAD', 'UPLOADING', 'VERIFYING', 'AVAILABLE', 'DELETE_PENDING', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StorageProviderKind" AS ENUM ('DEVELOPMENT', 'TERABOX');

-- CreateEnum
CREATE TYPE "StorageConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'NEEDS_REAUTH', 'DISABLED');

-- CreateEnum
CREATE TYPE "UploadSessionState" AS ENUM ('CREATED', 'UPLOADING', 'COMPLETING', 'VERIFIED', 'FAILED', 'EXPIRED', 'ABORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(3),
    "refreshTokenExpiresAt" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClassStatus" NOT NULL DEFAULT 'DRAFT',
    "timeZone" TEXT NOT NULL,
    "startsOn" DATE,
    "endsOn" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "intendedRecipientEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" TEXT,
    "status" "ClassSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "privateNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "classSessionId" TEXT,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "dueAt" TIMESTAMPTZ(3),
    "maximumScore" DECIMAL(10,2) NOT NULL,
    "state" "PublicationState" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "state" "SubmissionState" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(3),
    "text" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,
    "privateFeedback" TEXT,
    "state" "GradeState" NOT NULL DEFAULT 'DRAFT',
    "graderId" TEXT NOT NULL,
    "gradedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "folderId" TEXT,
    "provider" "StorageProviderKind" NOT NULL,
    "providerObjectIdentifier" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "uploadedById" TEXT NOT NULL,
    "lifecycleState" "FileLifecycleState" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassMaterialAttachment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassMaterialAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionMaterialAttachment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionMaterialAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentAttachment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAttachment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageConnection" (
    "id" TEXT NOT NULL,
    "provider" "StorageProviderKind" NOT NULL,
    "status" "StorageConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "providerAccountId" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(3),
    "refreshTokenExpiresAt" TIMESTAMPTZ(3),
    "apiDomain" TEXT,
    "uploadDomain" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StorageConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "storageConnectionId" TEXT,
    "state" "UploadSessionState" NOT NULL DEFAULT 'CREATED',
    "expectedByteSize" BIGINT NOT NULL,
    "expectedChecksumSha256" TEXT NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "nextChunkIndex" INTEGER NOT NULL DEFAULT 0,
    "encryptedProviderUploadId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "Class_ownerId_status_idx" ON "Class"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_status_idx" ON "Enrollment"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_classId_studentId_key" ON "Enrollment"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_id_classId_key" ON "Enrollment"("id", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_classId_intendedRecipientEmail_status_idx" ON "Invitation"("classId", "intendedRecipientEmail", "status");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_status_idx" ON "Invitation"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_classId_sequence_key" ON "ClassSession"("classId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_id_classId_key" ON "ClassSession"("id", "classId");

-- CreateIndex
CREATE INDEX "Attendance_enrollmentId_idx" ON "Attendance"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_classSessionId_enrollmentId_key" ON "Attendance"("classSessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "Assignment_classId_state_dueAt_idx" ON "Assignment"("classId", "state", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_id_classId_key" ON "Assignment"("id", "classId");

-- CreateIndex
CREATE INDEX "Submission_enrollmentId_state_idx" ON "Submission"("enrollmentId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_enrollmentId_key" ON "Submission"("assignmentId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_id_classId_key" ON "Submission"("id", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_submissionId_key" ON "Grade"("submissionId");

-- CreateIndex
CREATE INDEX "Grade_classId_state_idx" ON "Grade"("classId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_submissionId_classId_key" ON "Grade"("submissionId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_id_classId_key" ON "Folder"("id", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_classId_parentId_name_key" ON "Folder"("classId", "parentId", "name");

-- CreateIndex
CREATE INDEX "FileAsset_classId_folderId_lifecycleState_idx" ON "FileAsset"("classId", "folderId", "lifecycleState");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_provider_providerObjectIdentifier_key" ON "FileAsset"("provider", "providerObjectIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_id_classId_key" ON "FileAsset"("id", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMaterialAttachment_fileAssetId_key" ON "ClassMaterialAttachment"("fileAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMaterialAttachment_fileAssetId_classId_key" ON "ClassMaterialAttachment"("fileAssetId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionMaterialAttachment_fileAssetId_key" ON "SessionMaterialAttachment"("fileAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionMaterialAttachment_fileAssetId_classId_key" ON "SessionMaterialAttachment"("fileAssetId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentAttachment_fileAssetId_key" ON "AssignmentAttachment"("fileAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentAttachment_fileAssetId_classId_key" ON "AssignmentAttachment"("fileAssetId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttachment_fileAssetId_key" ON "SubmissionAttachment"("fileAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttachment_fileAssetId_classId_key" ON "SubmissionAttachment"("fileAssetId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageConnection_provider_providerAccountId_key" ON "StorageConnection"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "UploadSession_state_expiresAt_idx" ON "UploadSession"("state", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_actorId_idempotencyKey_key" ON "UploadSession"("actorId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classSessionId_classId_fkey" FOREIGN KEY ("classSessionId", "classId") REFERENCES "ClassSession"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_classId_fkey" FOREIGN KEY ("enrollmentId", "classId") REFERENCES "Enrollment"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classSessionId_classId_fkey" FOREIGN KEY ("classSessionId", "classId") REFERENCES "ClassSession"("id", "classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_classId_fkey" FOREIGN KEY ("assignmentId", "classId") REFERENCES "Assignment"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_enrollmentId_classId_fkey" FOREIGN KEY ("enrollmentId", "classId") REFERENCES "Enrollment"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_submissionId_classId_fkey" FOREIGN KEY ("submissionId", "classId") REFERENCES "Submission"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_graderId_fkey" FOREIGN KEY ("graderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_classId_fkey" FOREIGN KEY ("parentId", "classId") REFERENCES "Folder"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_folderId_classId_fkey" FOREIGN KEY ("folderId", "classId") REFERENCES "Folder"("id", "classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMaterialAttachment" ADD CONSTRAINT "ClassMaterialAttachment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMaterialAttachment" ADD CONSTRAINT "ClassMaterialAttachment_fileAssetId_classId_fkey" FOREIGN KEY ("fileAssetId", "classId") REFERENCES "FileAsset"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMaterialAttachment" ADD CONSTRAINT "SessionMaterialAttachment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMaterialAttachment" ADD CONSTRAINT "SessionMaterialAttachment_classSessionId_classId_fkey" FOREIGN KEY ("classSessionId", "classId") REFERENCES "ClassSession"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMaterialAttachment" ADD CONSTRAINT "SessionMaterialAttachment_fileAssetId_classId_fkey" FOREIGN KEY ("fileAssetId", "classId") REFERENCES "FileAsset"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttachment" ADD CONSTRAINT "AssignmentAttachment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttachment" ADD CONSTRAINT "AssignmentAttachment_assignmentId_classId_fkey" FOREIGN KEY ("assignmentId", "classId") REFERENCES "Assignment"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttachment" ADD CONSTRAINT "AssignmentAttachment_fileAssetId_classId_fkey" FOREIGN KEY ("fileAssetId", "classId") REFERENCES "FileAsset"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_submissionId_classId_fkey" FOREIGN KEY ("submissionId", "classId") REFERENCES "Submission"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_fileAssetId_classId_fkey" FOREIGN KEY ("fileAssetId", "classId") REFERENCES "FileAsset"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_fileAssetId_classId_fkey" FOREIGN KEY ("fileAssetId", "classId") REFERENCES "FileAsset"("id", "classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_storageConnectionId_fkey" FOREIGN KEY ("storageConnectionId") REFERENCES "StorageConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants that Prisma's schema language cannot express in v7.
ALTER TABLE "Class" ADD CONSTRAINT "Class_date_order_check"
  CHECK ("startsOn" IS NULL OR "endsOn" IS NULL OR "endsOn" >= "startsOn");
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_time_order_check"
  CHECK ("endsAt" > "startsAt");
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_sequence_positive_check"
  CHECK ("sequence" > 0);
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_maximum_score_positive_check"
  CHECK ("maximumScore" > 0);
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_score_nonnegative_check"
  CHECK ("score" >= 0);
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_byte_size_nonnegative_check"
  CHECK ("byteSize" >= 0);
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_sizes_check"
  CHECK ("expectedByteSize" >= 0 AND "chunkSize" > 0 AND "nextChunkIndex" >= 0);
