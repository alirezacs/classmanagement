import { ArrowRight, BookOpenCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-8">
    <header className="flex items-center justify-between" aria-label="Primary navigation"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-white"><BookOpenCheck className="size-5" /></span>Classroom</Link><Button asChild variant="outline" size="sm"><Link href="/sign-in">Sign in</Link></Button></header>
    <section className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.1fr_.9fr]">
      <div><p className="mb-4 text-sm font-semibold uppercase tracking-[.16em] text-[var(--accent)]">Private by design</p><h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Keep every class organized and every student informed.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">One secure workspace for classes, sessions, schedules, and attendance.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link href="/register">Create an account <ArrowRight className="ms-2 size-4" /></Link></Button><Button asChild variant="outline"><Link href="/api/health/live">Service status</Link></Button></div></div>
      <div className="rounded-3xl border bg-[var(--surface)] p-6 shadow-xl"><div className="mb-6 flex items-center gap-3 border-b pb-5"><span className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="size-5" /></span><div><p className="font-medium">Invitation-only access</p><p className="text-sm text-[var(--muted)]">Class data stays with its members.</p></div></div><div className="space-y-3" aria-label="Example class activity">{["Session 04 · Published", "Upcoming session · Tuesday", "Attendance · Recorded"].map((item) => <div key={item} className="rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">{item}</div>)}</div></div>
    </section>
  </main>;
}

