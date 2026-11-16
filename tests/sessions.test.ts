import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/authorization", () => ({ requireClassAccess: vi.fn(), requireClassOwner: vi.fn(), requireSessionAccess: vi.fn(), requireActiveEnrollment: vi.fn(), AccessDeniedError: class extends Error {} }));

import { generationInput, localDateTimeToUtc, previewGeneratedSessions, sessionInput, SessionScheduleError } from "@/server/services/sessions";

describe("session schedule generation", () => {
  it("converts local class time to UTC", () => {
    expect(localDateTimeToUtc("2026-01-15", "10:00", "Asia/Tehran").toISOString()).toBe("2026-01-15T06:30:00.000Z");
  });

  it("rejects invalid and DST-nonexistent local times", () => {
    expect(() => localDateTimeToUtc("2026-01-15", "25:00", "America/New_York")).toThrow(SessionScheduleError);
    expect(() => localDateTimeToUtc("2026-03-08", "02:30", "America/New_York")).toThrow(/does not exist/);
  });

  it("previews a shorter final session in total-duration mode", () => {
    const preview = previewGeneratedSessions("UTC", { mode: "total", startDate: "2026-01-05", weekdays: [1, 3, 5], localStartTime: "09:00", totalTeachingMinutes: 155, sessionDurationMinutes: 60, titlePrefix: "Lab" });
    expect(preview).toHaveLength(3);
    expect(preview.map((item) => item.durationMinutes)).toEqual([60, 60, 35]);
    expect(preview[2]?.partial).toBe(true);
  });

  it("rejects non-positive durations", () => {
    expect(() => previewGeneratedSessions("UTC", { mode: "count", startDate: "2026-01-05", weekdays: [1], localStartTime: "09:00", durationMinutes: 0, sessionCount: 2, titlePrefix: "Invalid" })).toThrow();
  });

  it("accepts an Entracte count and requires cancellation reasons", () => {
    expect(generationInput.parse({ mode: "count", startDate: "2026-01-05", weekdays: [1], localStartTime: "09:00", durationMinutes: 60, sessionCount: 2, entracteCount: 2 }).entracteCount).toBe(2);
    expect(() => sessionInput.parse({ title: "Cancelled", startsAt: "2026-01-05T09:00:00Z", endsAt: "2026-01-05T10:00:00Z", status: "CANCELLED" })).toThrow();
    expect(sessionInput.parse({ title: "Cancelled", startsAt: "2026-01-05T09:00:00Z", endsAt: "2026-01-05T10:00:00Z", status: "CANCELLED", cancellationReason: "Holiday" }).status).toBe("CANCELLED");
  });
});
