import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ update: vi.fn(async ({ data }: { data: unknown }) => data) }));
vi.mock("@/server/authorization", () => ({
  AccessDeniedError: class extends Error {},
  requireClassAccess: vi.fn(),
  requireSessionAccess: vi.fn(async () => ({ id: "session-1", classId: "class-1", startsAt: new Date("2026-01-01T09:00:00Z"), endsAt: new Date("2026-01-01T10:00:00Z"), status: "DRAFT", cancellationReason: null, entracteCount: 0 })),
  requireClassScopedPermission: vi.fn(async () => ({ id: "class-1", ownerId: "teacher-1", status: "ACTIVE" })),
}));
vi.mock("@/server/db", () => ({ db: {
  attendance: { aggregate: vi.fn(async () => ({ _max: { segmentNumber: 1 } })) },
  classSession: { update: mocks.update },
} }));
vi.mock("@/server/audit", () => ({ writeAudit: vi.fn() }));

import { updateSession } from "@/server/services/sessions";

describe("session status updates", () => {
  it("allows a status update when the session's only valid segment has attendance", async () => {
    await updateSession("teacher-1", "class-1", "session-1", { status: "COMPLETED", cancellationReason: null });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "session-1" }, data: { status: "COMPLETED", cancellationReason: null } });
  });
});
