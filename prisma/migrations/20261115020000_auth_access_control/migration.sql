-- Persistent Better Auth database rate limiting for serverless execution.
CREATE TABLE "rateLimit" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "lastRequest" BIGINT NOT NULL,
  CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- Application-owned persistent throttles for invitation endpoints.
CREATE TABLE "AbuseThrottle" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "windowStarts" TIMESTAMPTZ(3) NOT NULL,
  "blockedUntil" TIMESTAMPTZ(3),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "AbuseThrottle_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "AbuseThrottle_blockedUntil_idx" ON "AbuseThrottle"("blockedUntil");
