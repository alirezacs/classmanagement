import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteSessions: vi.fn(async () => ({ count: 2 })),
  updateAccount: vi.fn(async () => ({})),
  createAudit: vi.fn(async (input: { data: { details?: unknown; [key: string]: unknown } }) => { void input; return {}; }),
}));
vi.mock("@better-auth/utils/password", () => ({ hashPassword: vi.fn(async () => "safe-hash") }));
vi.mock("@/server/authorization", () => ({
  AccessDeniedError: class extends Error {},
  hasPermission: (context: { permissions: Set<string> }, key: string) => context.permissions.has(key),
  requirePermission: vi.fn(async (permission: string) => ({ id: "admin", email: "admin@example.test", name: "Admin", roles: [], permissions: new Set([permission]) })),
}));
vi.mock("@/server/db", () => ({ db: { $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({ user: { findUniqueOrThrow: vi.fn(async () => ({ id: "target" })) }, account: { findFirst: vi.fn(async () => ({ id: "credential" })), update: mocks.updateAccount }, authSession: { deleteMany: mocks.deleteSessions }, auditLog: { create: mocks.createAudit } })) } }));

import { setUserPassword } from "@/server/services/admin";

describe("administrative credential changes", () => {
  it("stores only a password hash, revokes sessions, and audits without password material", async () => {
    await setUserPassword("target", "new-password-123");
    expect(mocks.updateAccount).toHaveBeenCalledWith({ where: { id: "credential" }, data: { password: "safe-hash" } });
    expect(mocks.deleteSessions).toHaveBeenCalledWith({ where: { userId: "target" } });
    const auditData = mocks.createAudit.mock.calls[0]?.[0]?.data;
    expect(JSON.stringify(auditData)).not.toContain("new-password-123");
    expect(auditData?.details).toEqual({ sessionsRevoked: true });
  });
});
