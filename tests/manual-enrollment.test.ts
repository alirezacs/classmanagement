import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  existingStudent: null as null | { id: string; name: string; email: string; accounts: Array<{ id: string }> },
  createAccount: vi.fn(async () => ({})),
  upsertRole: vi.fn(async () => ({})),
  upsertEnrollment: vi.fn(async () => ({ id: "enrollment-1" })),
}));

vi.mock("@better-auth/utils/password", () => ({ hashPassword: vi.fn(async () => "compatible-password-hash") }));
vi.mock("@/server/authorization", () => ({
  AccessDeniedError: class extends Error {},
  requireClassScopedPermission: vi.fn(async () => ({ id: "class-1", status: "ACTIVE" })),
  requireActiveEnrollment: vi.fn(),
  requireClassAccess: vi.fn(),
  requireAuthorizationContext: vi.fn(),
  hasPermission: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db: {
  $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
    user: {
      findUnique: vi.fn(async () => mocks.existingStudent),
      create: vi.fn(async ({ data }: { data: { name: string; email: string } }) => ({ id: "student-1", ...data, accounts: [] })),
    },
    role: { findUniqueOrThrow: vi.fn(async () => ({ id: "role_student" })) },
    userRole: { upsert: mocks.upsertRole },
    account: { create: mocks.createAccount },
    enrollment: { upsert: mocks.upsertEnrollment },
  })),
} }));

import { manuallyEnrollStudent } from "@/server/services/classes";

describe("manual student enrollment", () => {
  beforeEach(() => {
    mocks.existingStudent = null;
    vi.clearAllMocks();
  });

  it("creates a compatible credential and assigns the Student role", async () => {
    const result = await manuallyEnrollStudent("teacher-1", "class-1", { name: "Student", email: "student@example.test", temporaryPassword: "temporary-password" });
    expect(mocks.createAccount).toHaveBeenCalledWith({ data: { userId: "student-1", accountId: "student-1", providerId: "credential", password: "compatible-password-hash" } });
    expect(mocks.upsertRole).toHaveBeenCalledWith({ where: { userId_roleId: { userId: "student-1", roleId: "role_student" } }, update: {}, create: { userId: "student-1", roleId: "role_student", assignedById: "teacher-1" } });
    expect(result.temporaryPassword).toBe("temporary-password");
  });

  it("assigns the Student role when an existing account is enrolled", async () => {
    mocks.existingStudent = { id: "existing-student", name: "Existing", email: "existing@example.test", accounts: [{ id: "credential-1" }] };
    await manuallyEnrollStudent("teacher-1", "class-1", { name: "Existing", email: "existing@example.test" });
    expect(mocks.upsertRole).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_roleId: { userId: "existing-student", roleId: "role_student" } } }));
    expect(mocks.createAccount).not.toHaveBeenCalled();
  });
});
