import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ClassManager } from "@/components/admin-console";
import { ClassCreator } from "@/components/admin-class-tools";
import { UserCreator } from "@/components/admin-user-tools";
import { listAllClasses } from "@/server/services/admin";
import { requirePermission } from "@/server/authorization";
import { canDelegate } from "@/server/permissions";
import { db } from "@/server/db";

type Query = { search?: string; page?: string; status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | ""; teacherId?: string };

export default async function AdminClassesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const operator = await requirePermission("classes.read.all");
  const [result, teachers, teacherRole] = await Promise.all([
    listAllClasses({ ...params, status: params.status || undefined, pageSize: 50 }),
    db.user.findMany({ where: { roles: { some: { role: { key: "teacher" } } } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, disabledAt: true } }),
    db.role.findUnique({ where: { key: "teacher" }, select: { id: true, permissions: { select: { permissionKey: true } } } }),
  ]);
  const selectedTeacher = teachers.find((teacher) => teacher.id === params.teacherId);
  const canCreateTeacher = teacherRole && operator.permissions.has("users.create") && operator.permissions.has("roles.assign") && canDelegate(operator.permissions, teacherRole.permissions.map((item) => item.permissionKey));

  return <>
    {params.teacherId && operator.permissions.has("users.read") && <Link href="/admin/users" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to teachers</Link>}
    <PageHeader eyebrow="Teaching workspace" title={selectedTeacher ? `${selectedTeacher.name}’s classes` : "Class administration"} description={selectedTeacher ? `Browse this teacher’s classes, manage students, and plan upcoming sessions. ${selectedTeacher.email}` : "Organize your classes, connect teachers, and make room for learning."} actions={<div className="flex flex-wrap gap-2">{canCreateTeacher && <UserCreator teacherRoleId={teacherRole.id} variant="outline" />}{operator.permissions.has("classes.create.any") && <ClassCreator teachers={teachers.filter((teacher) => !teacher.disabledAt)} teacherId={params.teacherId ?? ""} />}</div>} />
    <section aria-labelledby="classes-heading">
      <div className="mb-5 flex items-center gap-2"><h2 id="classes-heading" className="text-xl font-semibold">{selectedTeacher ? "Teacher’s classes" : "All classes"}</h2><span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">{result.total}</span></div>
      <form key={`${params.teacherId}:${params.search}:${params.status}`} className="mb-6 flex flex-wrap gap-3 rounded-2xl border bg-[var(--surface)] p-3">
        <label className="relative min-w-0 basis-full sm:min-w-48 sm:flex-1 sm:basis-auto"><span className="sr-only">Search classes</span><Search aria-hidden="true" className="pointer-events-none absolute start-3 top-3 size-4 text-[var(--muted)]" /><input name="search" defaultValue={params.search} maxLength={100} placeholder="Search classes…" className="h-10 w-full rounded-xl border-0 bg-[var(--background)] pe-3 ps-10 text-sm" /></label>
        <label className="min-w-0 flex-1 sm:max-w-56"><span className="sr-only">Teacher</span><select name="teacherId" defaultValue={params.teacherId ?? ""} className="h-10 w-full rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.disabledAt ? " (deactivated)" : ""}</option>)}</select></label>
        <label className="min-w-0 flex-1 sm:flex-none"><span className="sr-only">Class status</span><select name="status" defaultValue={params.status ?? ""} className="h-10 w-full rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
        <Button variant="outline">Search</Button>
        {(params.search || params.status) && <Button asChild variant="outline"><Link href={params.teacherId ? `/admin/classes?teacherId=${encodeURIComponent(params.teacherId)}` : "/admin/classes"}>Clear</Link></Button>}
      </form>
      <ClassManager classes={result.items} />
      <Pagination pathname="/admin/classes" query={params} page={result.page} pageSize={result.pageSize} total={result.total} />
    </section>
  </>;
}
