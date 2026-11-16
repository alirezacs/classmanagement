import "server-only";
import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL_POOLED: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

export function readServerEnvironment() {
  return serverEnvironmentSchema.parse(process.env);
}

export function databaseUrlForBuildOrRuntime(): string {
  const value = process.env.DATABASE_URL_POOLED;
  if (value) return value;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }
  throw new Error("DATABASE_URL_POOLED is required at runtime");
}

export function authSecretForBuildOrRuntime(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NEXT_PHASE === "phase-production-build") return "build-only-placeholder-not-used-runtime";
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
}

