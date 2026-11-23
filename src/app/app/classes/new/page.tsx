"use client";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, LoaderCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function NewClassPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.get("title"), description: data.get("description") || null, timeZone: data.get("timeZone"), startsOn: data.get("startsOn") || null, endsOn: data.get("endsOn") || null }) });
      const created = await response.json().catch(() => ({})) as { id?: string; error?: string };
      if (!response.ok || !created.id) throw new Error(created.error ?? "Could not create this class. Please try again.");
      router.push(`/teacher/classes/${created.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create this class. Please try again."); }
    finally { setPending(false); }
  }
  return <WorkspaceShell title="Create class"><div className="max-w-5xl">
    <Link href="/teacher/classes" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to classes</Link>
    <PageHeader eyebrow="Teaching workspace" title="Create a class" description="A new space for your students to learn. Start with the basics and make it yours." />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <form onSubmit={submit} className="rounded-2xl border bg-[var(--surface)] shadow-sm">
        <div className="flex items-center gap-3 border-b p-5 sm:px-7"><span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><BookOpen className="size-5" aria-hidden="true" /></span><div><h2 className="font-semibold">Class details</h2><p className="mt-1 text-xs text-[var(--muted)]">You can update these details later.</p></div></div>
        <fieldset disabled={pending} className="space-y-5 p-5 sm:p-7"><legend className="sr-only">Class basics</legend>
          <label className="block text-sm font-semibold">Class title<input name="title" required maxLength={160} placeholder="e.g. Introduction to web design" className="mt-2 h-12 w-full rounded-xl border bg-[var(--background)] px-3 font-normal" /></label>
          <label className="block text-sm font-semibold">Description <span className="font-normal text-[var(--muted)]">(optional)</span><textarea name="description" rows={4} maxLength={5000} placeholder="What will your students learn in this class?" className="mt-2 w-full resize-y rounded-xl border bg-[var(--background)] p-3 font-normal" /></label>
          <label className="block text-sm font-semibold">Time zone<input name="timeZone" defaultValue="Asia/Tehran" required maxLength={80} aria-describedby="timezone-help" className="mt-2 h-12 w-full rounded-xl border bg-[var(--background)] px-3 font-normal" /></label>
          <p id="timezone-help" className="text-xs leading-5 text-[var(--muted)]">Used for your session schedule. For example: Asia/Tehran or Europe/London.</p>
        </fieldset>
        {error && <p role="alert" className="px-5 pb-5 text-sm text-[var(--danger)] sm:px-7">{error}</p>}
        <div className="flex justify-end gap-3 border-t p-5 sm:px-7"><Button variant="outline" type="button" disabled={pending} onClick={() => router.back()}>Cancel</Button><Button disabled={pending}>{pending && <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden="true" />}{pending ? "Creating…" : "Create class"}</Button></div>
      </form>
      <aside className="rounded-2xl border bg-[var(--accent-soft)] p-6"><h2 className="text-sm font-semibold">What comes next?</h2><div className="mt-5 space-y-5"><div className="flex gap-3"><Users className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" aria-hidden="true" /><div><h3 className="text-sm font-semibold">Bring your students in</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Add students or invite them to join your class.</p></div></div><div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" aria-hidden="true" /><div><h3 className="text-sm font-semibold">Plan your sessions</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Set your schedule and keep attendance in one place.</p></div></div></div></aside>
    </div>
  </div></WorkspaceShell>;
}
