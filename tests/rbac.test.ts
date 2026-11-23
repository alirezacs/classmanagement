import { describe, expect, it } from "vitest";
import { canDelegate, DEFAULT_ROLE_PERMISSIONS, isAccessManager, PERMISSIONS } from "@/server/permissions";

describe("registered RBAC capabilities", () => {
  it("uses unique stable permission keys", () => {
    const keys = PERMISSIONS.map((permission) => permission.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("admin.access");
    expect(keys).toContain("classes.read.enrolled");
  });
  it("gives teachers owned scope and students enrollment scope without global access", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.teacher).toContain("classes.update.own");
    expect(DEFAULT_ROLE_PERMISSIONS.teacher).not.toContain("classes.update.any");
    expect(DEFAULT_ROLE_PERMISSIONS.student).toEqual(["classes.read.enrolled"]);
  });
  it("prevents direct and indirect delegation beyond the operator", () => {
    const limited = new Set<string>(["roles.assign", "permissions.assign", "classes.read.all"]);
    expect(canDelegate(limited, ["classes.read.all"])).toBe(true);
    expect(canDelegate(limited, ["classes.update.any"])).toBe(false);
    expect(canDelegate(limited, ["roles.assign", "users.password.set"])).toBe(false);
  });
  it("recognizes only operators who can retain administrative recovery", () => {
    expect(isAccessManager(["admin.access", "roles.assign", "permissions.assign"])).toBe(true);
    expect(isAccessManager(["admin.access", "roles.assign"])).toBe(false);
  });
});
