import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/authorization", () => ({ requireClassAccess: vi.fn(), requireClassOwner: vi.fn(), requireActiveEnrollment: vi.fn(), AccessDeniedError: class extends Error {} }));

import { updateClassInput } from "@/server/services/classes";

describe("class updates", () => {
  it("accepts a partial update when renaming a class", () => {
    expect(updateClassInput.parse({ title: "Renamed class" })).toEqual({ title: "Renamed class" });
  });

  it("keeps date-order validation for updates", () => {
    expect(() => updateClassInput.parse({ startsOn: "2026-02-02", endsOn: "2026-02-01" })).toThrow(/End date must be after start date/);
  });
});
