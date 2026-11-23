import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { hasPermission, requireAuthorizationContext } from "@/server/authorization";
import { getClassSummary, listClassRoster } from "@/server/services/classes";
import { getMyAttendance, listSessions } from "@/server/services/sessions";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ClassWorkspaceClient, type WorkspaceData } from "@/components/class-workspace-client";

const tabs = ["overview", "people", "sessions"] as const;

export async function ClassWorkspace({ classId, section = "overview", student = false, admin = false }: { classId: string; section?: string; student?: boolean; admin?: boolean }) {
  let user;
  try { user = await requireAuthorizationContext(); } catch { redirect("/sign-in"); }
  const [summary, roster, sessions, ownAttendance] = await Promise.all([
    getClassSummary(user.id, classId),
    listClassRoster(user.id, classId, { page: 1, pageSize: 100, search: "" }),
    listSessions(user.id, classId, !student),
    student ? getMyAttendance(user.id, classId) : Promise.resolve([]),
  ]);
  const base = admin ? `/admin/classes/${classId}` : student ? `/student/classes/${classId}` : `/teacher/classes/${classId}`;
  const active = tabs.includes(section as typeof tabs[number]) ? section : "overview";
  const data: WorkspaceData = {
    classId, base, student, admin,
    summary: { ...summary, startsOn: summary.startsOn?.toISOString() ?? null, endsOn: summary.endsOn?.toISOString() ?? null },
    roster: roster.items.map((row) => ({ ...row, enrolledAt: "enrolledAt" in row && row.enrolledAt ? row.enrolledAt.toISOString() : null })),
    sessions: sessions.items.map((item) => ({ ...item, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), attendance: ("attendance" in item && Array.isArray(item.attendance) ? item.attendance : ownAttendance.filter((row) => row.classSessionId === item.id)) as Array<{ id?: string; enrollmentId?: string; classSessionId?: string; status: string; privateNote?: string | null; moment: string; segmentNumber: number }> })),
  };
  const content = <>
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--accent)]">{student ? "Enrolled class" : "Class workspace"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{summary.title}</h1><p className="mt-2 max-w-2xl text-[var(--muted)]">{summary.description ?? "No class description yet."}</p></div>{!student && <Link href={`${base}/sessions`} className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold"><Plus className="me-2 size-4" />Manage sessions</Link>}</div>
    <div className="mt-6 flex gap-1 overflow-x-auto border-b" role="tablist" aria-label="Class sections">{tabs.map((tab) => <Link key={tab} href={`${base}${tab === "overview" ? "" : `/${tab}`}`} role="tab" aria-selected={active === tab} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold capitalize ${active === tab ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"}`}>{tab === "people" && student ? "Classmates" : tab}</Link>)}</div>
    <ClassWorkspaceClient data={data} section={active} />
  </>;
  const areas = [...(hasPermission(user, "admin.access") ? [{ href: "/admin", label: "Admin" }] : []), ...(hasPermission(user, "classes.read.own") ? [{ href: "/teacher", label: "Teacher" }] : []), ...(hasPermission(user, "classes.read.enrolled") ? [{ href: "/student", label: "Student" }] : [])];
  return admin ? content : <WorkspaceShell role={student ? "Student" : "Teacher"} title={summary.title} userName={user.name} userEmail={user.email} areas={areas}>{content}</WorkspaceShell>;
}
