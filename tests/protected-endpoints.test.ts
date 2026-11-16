import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  class AuthenticationRequiredError extends Error {}
  class AccessDeniedError extends Error {}
  return { user: { id: "teacher-owner", email: "owner@example.test", name: "Owner" } as { id: string; email: string; name: string } | null, access: "OWNER" as "OWNER" | "STUDENT" | "DENY", AuthenticationRequiredError, AccessDeniedError };
});

vi.mock("@/server/authorization", () => {
  return {
    AuthenticationRequiredError: state.AuthenticationRequiredError,
    AccessDeniedError: state.AccessDeniedError,
    requireAuthenticatedUser: vi.fn(async () => { if (!state.user) throw new state.AuthenticationRequiredError("Authentication required"); return state.user; }),
    requireClassAccess: vi.fn(async () => {
      if (state.access === "DENY") throw new state.AccessDeniedError("Not found");
      return { classRecord: { id: "class-a", title: "Private class" }, role: state.access, enrollment: state.access === "STUDENT" ? { id: "enrollment-a" } : null };
    }),
  };
});
vi.mock("@/server/http", () => ({ protectedRouteError: (error: unknown) => {
  if (error instanceof state.AuthenticationRequiredError) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (error instanceof state.AccessDeniedError) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ error: "Request could not be completed" }, { status: 400 });
} }));

import { GET as classGet } from "../src/app/api/classes/[classId]/route";

describe("protected route handlers called directly", () => {
  beforeEach(() => { state.user = { id: "teacher-owner", email: "owner@example.test", name: "Owner" }; state.access = "OWNER"; });
  const classRequest = () => classGet(new Request("https://example.test/api/classes/class-a") as never, { params: Promise.resolve({ classId: "class-a" }) });

  it("rejects unauthenticated callers", async () => {
    state.user = null;
    expect((await classRequest()).status).toBe(401);
  });
  it("allows the owning teacher", async () => {
    state.access = "OWNER";
    const response = await classRequest(); expect(response.status).toBe(200); expect((await response.json()).role).toBe("OWNER");
  });
  it("rejects an unrelated teacher without disclosing the class", async () => {
    state.user = { id: "teacher-other", email: "other@example.test", name: "Other" }; state.access = "DENY";
    const response = await classRequest(); expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: "Not found" });
  });
  it("allows an enrolled student", async () => {
    state.user = { id: "student-enrolled", email: "student@example.test", name: "Student" }; state.access = "STUDENT";
    expect((await classRequest()).status).toBe(200);
  });
  it("rejects an unrelated student", async () => {
    state.user = { id: "student-other", email: "other.student@example.test", name: "Other student" }; state.access = "DENY";
    expect((await classRequest()).status).toBe(404);
  });
});

