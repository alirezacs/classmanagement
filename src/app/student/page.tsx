import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ClassCard } from "@/components/ui/class-card";
import { hasPermission, requireAuthorizationContext } from "@/server/authorization";
import { studentDashboard } from "@/server/services/dashboard";
export const dynamic = "force-dynamic";
export default async function StudentPage() { let user; try { user = await requireAuthorizationContext(); } catch { redirect("/sign-in?next=/student"); } if (!hasPermission(user, "classes.read.enrolled")) redirect(hasPermission(user, "classes.read.own") ? "/teacher" : "/sign-in"); const data = await studentDashboard(user.id); return <WorkspaceShell role="Student" userName={user.name} userEmail={user.email}><PageHeader eyebrow="Learning area" title={`Welcome, ${user.name.split(" ")[0]}`} description="Your active enrollments, sessions, and personal attendance." /><div className="grid gap-4 sm:grid-cols-2"><StatCard label="Enrolled classes" value={String(data.enrolledClassCount)} detail="Active memberships" icon={BookOpen} /><StatCard label="Upcoming sessions" value={String(data.upcomingSessions.length)} detail="Visible non-cancelled sessions" icon={CalendarDays} /></div><section className="mt-10"><h2 className="mb-4 text-xl font-semibold">Your classes</h2><div className="grid gap-4 lg:grid-cols-2">{data.enrollments.map((item) => <ClassCard key={item.id} id={item.class.id} href={`/student/classes/${item.class.id}`} title={item.class.title} subject={`with ${item.class.owner.name}`} students={item.class._count.enrollments} next="Open learning space" />)}</div>{data.enrollments.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-sm text-[var(--muted)]">No active enrollments.</p>}<Link href="/app/settings" className="mt-6 inline-block text-sm font-semibold text-[var(--accent)]">Account settings</Link></section></WorkspaceShell>; }
