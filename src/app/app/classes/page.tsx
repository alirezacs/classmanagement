import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/authorization";
import { listOwnedClasses } from "@/server/services/classes";
import { WorkspaceShell } from "@/components/workspace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  let user; try { user = await requireAuthenticatedUser(); } catch { redirect("/sign-in"); }
  const params = await searchParams;
  const result = await listOwnedClasses(user.id, { search: params.search ?? "", page: params.page ?? "1", pageSize: "20" });
  return <WorkspaceShell><PageHeader eyebrow="Teaching" title="Your classes" description="Keep each class, roster, and learning timeline in one focused workspace." actions={<Button asChild><Link href="/app/classes/new">Create class</Link></Button>} /><form className="mt-8 flex max-w-xl gap-3" method="get"><input name="search" defaultValue={params.search} placeholder="Search classes" aria-label="Search classes" className="h-11 min-w-0 flex-1 rounded-xl border bg-[var(--surface)] px-3 text-sm" /><Button variant="outline" type="submit">Search</Button></form><div className="mt-6 grid gap-4 lg:grid-cols-2">{result.items.length ? result.items.map((item) => <Link key={item.id} href={`/app/classes/${item.id}`} className="rounded-2xl border bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-4"><div><StatusBadge status={item.status} tone={item.status === "ARCHIVED" ? "neutral" : "success"} /><h2 className="mt-3 text-lg font-semibold">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.description ?? "No description yet."}</p></div><span className="text-sm text-[var(--muted)]">{item.studentCount} active students</span></div></Link>) : <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--muted)]">No classes match that search.</div>}</div></WorkspaceShell>;
}
