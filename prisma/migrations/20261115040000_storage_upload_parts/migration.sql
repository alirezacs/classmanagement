ALTER TABLE "StorageConnection" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "StorageConnection" ADD CONSTRAINT "StorageConnection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "StorageConnection_ownerId_idx" ON "StorageConnection"("ownerId");
CREATE TABLE "UploadPart" (
  "id" TEXT NOT NULL,
  "uploadSessionId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "checksumMd5" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "UploadPart_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UploadPart_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "UploadSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "UploadPart_uploadSessionId_index_key" ON "UploadPart"("uploadSessionId", "index");
CREATE INDEX "UploadPart_uploadSessionId_idx" ON "UploadPart"("uploadSessionId");
