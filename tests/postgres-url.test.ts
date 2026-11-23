import { describe, expect, it } from "vitest";
import { normalizePostgresConnectionString } from "@/server/postgres-url";

describe("PostgreSQL connection URLs", () => {
  it.each(["prefer", "require", "verify-ca"])("preserves pg 8 verified TLS behavior for %s", (sslMode) => {
    const result = new URL(normalizePostgresConnectionString(`postgresql://user:secret@db.example.com/app?sslmode=${sslMode}`));
    expect(result.searchParams.get("sslmode")).toBe("verify-full");
  });

  it("does not alter explicit libpq compatibility", () => {
    const value = "postgresql://user:secret@db.example.com/app?uselibpqcompat=true&sslmode=require";
    expect(normalizePostgresConnectionString(value)).toContain("sslmode=require");
  });
});
