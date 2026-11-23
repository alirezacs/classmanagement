import Link from "next/link";
import { ArrowUpRight, BookOpen, GraduationCap, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserManager } from "@/components/admin-console";
import { UserCreator } from "@/components/admin-user-tools";
import { listRoles, listUsers } from "@/server/services/admin";
import { requirePermission } from "@/server/authorization";
import { canDelegate } from "@/server/permissions";
import { cn } from "@/lib/utils";

type Query = { search?: string; page?: string; role?: string; status?: "active" | "disabled" | ""; view?: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const operator = await requirePermission("users.read");
  const allAccounts = params.view === "all" || Boolean(params.role && params.role !== "teacher");
  const [users, roleRows] = await Promise.all([
    listUsers({ ...params, role: allAccounts ? params.role : "teacher", status: params.status || undefined, pageSize: 50 }),
    operator.permissions.has("roles.read") ? listRoles() : Promise.resolve([]),
  ]);
  const teacherRole = roleRows.find((role) => role.key === "teacher");
  const canCreateTeacher = teacherRole && operator.permissions.has("users.create") && operator.permissions.has("roles.assign") && canDelegate(operator.permissions, teacherRole.permissions.map((item) => item.permissionKey));
  const canViewClasses = operator.permissions.has("classes.read.all");
  const query = { ...params, view: allAccounts ? "all" : "teachers" };

  return <>
    <PageHeader eyebrow="People & teaching" title="User management" description="Your teaching team, their classes, and account details — all in one place." actions={<div className="flex flex-wrap gap-2">{operator.permissions.has("users.create") && <UserCreator variant="outline" />}{canCreateTeacher && <UserCreator teacherRoleId={teacherRole.id} />}</div>} />
    <nav aria-label="User directory" className="mb-6 flex gap-1 border-b">
      {[{ href: "/admin/users", active: !allAccounts, label: "Teachers", icon: GraduationCap }, { href: "/admin/users?view=all", active: allAccounts, label: "All accounts", icon: Users }].map(({ href, active, label, icon: Icon }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition", active ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]")}><Icon className="size-4" aria-hidden="true" />{label}</Link>)}
    </nav>
    <section aria-labelledby="directory-heading">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 id="directory-heading" className="text-xl font-semibold">{allAccounts ? "Account directory" : "Teaching team"}<span className="ms-2 rounded-lg bg-[var(--surface-muted)] px-2 py-1 align-middle text-xs text-[var(--muted)]">{users.total}</span></h2><p className="mt-1 text-sm text-[var(--muted)]">{allAccounts ? "Open an account to edit its profile, roles, and security settings." : "Select a teacher to explore and manage their classes."}</p></div></div>
      <form key={`${query.view}:${params.search}:${params.status}`} className="mb-6 flex flex-wrap gap-3 rounded-2xl border bg-[var(--surface)] p-3">
        <input type="hidden" name="view" value={query.view} />
        {allAccounts && params.role && <input type="hidden" name="role" value={params.role} />}
        <label className="relative min-w-0 basis-full sm:min-w-52 sm:flex-1 sm:basis-auto"><span className="sr-only">Search name or email</span><Search aria-hidden="true" className="pointer-events-none absolute start-3 top-3 size-4 text-[var(--muted)]" /><input name="search" defaultValue={params.search} maxLength={100} placeholder={allAccounts ? "Search accounts by name or email…" : "Search teachers by name or email…"} className="h-10 w-full rounded-xl border-0 bg-[var(--background)] pe-3 ps-10 text-sm" /></label>
        <label className="min-w-0 flex-1 sm:flex-none"><span className="sr-only">Account status</span><select name="status" defaultValue={params.status ?? ""} className="h-10 w-full rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="disabled">Deactivated</option></select></label>
        <Button variant="outline">Search</Button>
        {(params.search || params.status || params.role) && <Button asChild variant="outline"><Link href={allAccounts ? "/admin/users?view=all" : "/admin/users"}>Clear</Link></Button>}
      </form>
      {allAccounts ? <UserManager users={users.items} roles={roleRows.map((role) => ({ id: role.id, name: role.name, key: role.key }))} permissions={[...operator.permissions]} /> : <div className="grid gap-4 xl:grid-cols-2">
        {users.items.map((teacher) => {
          const content = <>
            <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-xl font-semibold text-[var(--accent)]">{teacher.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><h3 className="break-words font-semibold group-hover:text-[var(--accent)]">{teacher.name}</h3><p className="mt-1 break-all text-sm text-[var(--muted)]">{teacher.email}</p></div><StatusBadge tone={teacher.disabledAt ? "neutral" : "success"}>{teacher.disabledAt ? "Deactivated" : "Active"}</StatusBadge></div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><BookOpen className="size-4" aria-hidden="true" /><strong className="font-semibold text-[var(--foreground)]">{teacher._count.ownedClasses}</strong> classes</span>{canViewClasses && <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">View classes<ArrowUpRight className="size-4" aria-hidden="true" /></span>}</div>
          </>;
          const card = "group min-w-0 rounded-2xl border bg-[var(--surface)] p-5 transition sm:p-6";
          return canViewClasses ? <Link key={teacher.id} href={`/admin/classes?teacherId=${encodeURIComponent(teacher.id)}`} className={`${card} hover:border-[var(--accent)] hover:shadow-md`}>{content}</Link> : <article key={teacher.id} className={card}>{content}</article>;
        })}
        {!users.items.length && <div className="rounded-2xl border border-dashed bg-[var(--surface)] px-6 py-14 text-center xl:col-span-2"><GraduationCap aria-hidden="true" className="mx-auto size-9 text-[var(--muted)]" /><h3 className="mt-4 text-lg font-semibold">No teachers found</h3><p className="mt-2 text-sm text-[var(--muted)]">Try another search or add your first teacher to get started.</p></div>}
      </div>}
      <Pagination pathname="/admin/users" query={query} page={users.page} pageSize={users.pageSize} total={users.total} />
    </section>
  </>;
}
