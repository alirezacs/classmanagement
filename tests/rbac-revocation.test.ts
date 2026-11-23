import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ permissionKeys: ["admin.access"] as string[] }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/server/auth", () => ({ auth: { api: { getSession: vi.fn(async () => ({ user: { id: "operator", email: "operator@example.test", name: "Operator" } })) } } }));
vi.mock("@/server/db", () => ({ db: { user: { findUnique: vi.fn(async () => ({ id: "operator", email: "operator@example.test", name: "Operator", disabledAt: null, roles: [{ role: { key: "custom", name: "Custom", permissions: state.permissionKeys.map((permissionKey) => ({ permissionKey })) } }] })) } } }));

import { AccessDeniedError, requirePermission } from "@/server/authorization";

describe("permission revocation", () => {
  beforeEach(() => { state.permissionKeys = ["admin.access"]; });
  it("takes effect on the next protected request without a new login", async () => {
    await expect(requirePermission("admin.access")).resolves.toMatchObject({ id: "operator" });
    state.permissionKeys = [];
    await expect(requirePermission("admin.access")).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
