import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permissions: new Set(["users.read", "roles.read", "classes.read.all"]),
  listUsers: vi.fn(),
  listRoles: vi.fn(async () => []),
  listAllClasses: vi.fn(),
  teachers: [{ id: "teacher-a", name: "Sara", email: "sara@example.test", disabledAt: null }],
}));
vi.mock("@/server/authorization", () => ({ requirePermission: vi.fn(async () => ({ permissions: mocks.permissions })) }));
vi.mock("@/server/services/admin", () => ({ listUsers: mocks.listUsers, listRoles: mocks.listRoles, listAllClasses: mocks.listAllClasses }));
vi.mock("@/server/db", () => ({ db: { user: { findMany: vi.fn(async () => mocks.teachers) }, role: { findUnique: vi.fn(async () => null) } } }));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("lucide-react", () => ({ ArrowUpRight: "svg", ArrowLeft: "svg", BookOpen: "svg", GraduationCap: "svg", Search: "svg", Users: "svg" }));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/components/admin-console", () => ({ UserManager: "user-manager", ClassManager: "class-manager" }));
vi.mock("@/components/admin-user-tools", () => ({ UserCreator: "user-creator" }));
vi.mock("@/components/admin-class-tools", () => ({ ClassCreator: "class-creator" }));

import UsersPage from "@/app/admin/users/page";
import AdminClassesPage from "@/app/admin/classes/page";
import { Pagination } from "@/components/ui/pagination";

describe("admin teacher directory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = new Set(["users.read", "roles.read", "classes.read.all"]);
    mocks.listUsers.mockResolvedValue({ items: [{ ...mocks.teachers[0], _count: { ownedClasses: 2 } }], total: 1, page: 1, pageSize: 50 });
    mocks.listAllClasses.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });
  });

  it("requests teachers by default and links each teacher to their own classes", async () => {
    const page = await UsersPage({ searchParams: Promise.resolve({}) });
    expect(mocks.listUsers).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }));
    expect(JSON.stringify(page)).toContain("/admin/classes?teacherId=teacher-a");
    expect(JSON.stringify(page)).not.toContain('"type":"user-manager"');
  });

  it("keeps all accounts accessible and accepts the empty status from the search form", async () => {
    const page = await UsersPage({ searchParams: Promise.resolve({ view: "all", status: "", search: "student" }) });
    expect(mocks.listUsers).toHaveBeenCalledWith(expect.objectContaining({ role: undefined, status: undefined, search: "student" }));
    expect(JSON.stringify(page)).toContain('"type":"user-manager"');
  });

  it("does not require role access or expose class links to a user-only operator", async () => {
    mocks.permissions = new Set(["users.read"]);
    const page = await UsersPage({ searchParams: Promise.resolve({}) });
    expect(mocks.listRoles).not.toHaveBeenCalled();
    expect(JSON.stringify(page)).not.toContain("/admin/classes?");
  });

  it("keeps the selected teacher when searching classes with any status", async () => {
    const page = await AdminClassesPage({ searchParams: Promise.resolve({ teacherId: "teacher-a", status: "", search: "design" }) });
    expect(mocks.listAllClasses).toHaveBeenCalledWith(expect.objectContaining({ teacherId: "teacher-a", status: undefined, search: "design" }));
    expect(JSON.stringify(page)).toContain("Sara’s classes");
    expect(JSON.stringify(page)).toContain("/admin/classes?teacherId=teacher-a");
  });

  it("preserves teacher and search filters across pages", () => {
    const pagination = Pagination({ pathname: "/admin/classes", query: { teacherId: "teacher-a", search: "web design", status: "" }, page: 1, pageSize: 50, total: 51 });
    expect(JSON.stringify(pagination)).toContain("/admin/classes?teacherId=teacher-a&search=web+design&page=2");
  });
});
