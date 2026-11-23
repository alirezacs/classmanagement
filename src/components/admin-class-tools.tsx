"use client";
import { BookOpen, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

async function patchJson(url: string, body: object) { const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Request could not be completed"); return payload; }
export function ClassOwnerEditor({ classId, ownerId, teachers }: { classId: string; ownerId: string; teachers: Array<{ id: string; name: string; email: string }> }) { const router = useRouter(); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); try { await patchJson(`/api/admin/classes/${classId}`, { ownerId: String(new FormData(event.currentTarget).get("ownerId")) }); setMessage("Ownership changed and audited. Previous owner-based access is no longer valid."); router.refresh(); } catch (error) { setMessage((error as Error).message); } finally { setPending(false); } } return <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-[var(--surface)] p-4"><label className="min-w-72 flex-1 text-sm font-semibold">Owning teacher<select name="ownerId" defaultValue={ownerId} className="mt-2 h-10 w-full rounded-xl border bg-transparent px-3 font-normal">{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.email}</option>)}</select></label><button disabled={pending} className="h-10 rounded-xl border px-4 text-sm font-semibold">{pending ? "Saving…" : "Reassign teacher"}</button>{message && <p role="status" className="w-full text-sm text-[var(--muted)]">{message}</p>}</form>; }


export function ClassCreator({ teachers, teacherId = "" }: { teachers: Array<{ id: string; name: string; email: string }>; teacherId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const input = "mt-2 h-11 w-full rounded-xl border bg-[var(--surface)] px-3 text-sm font-normal";
  function close() { if (!pending) { setOpen(false); setError(""); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: form.get("ownerId"), title: form.get("title"), description: form.get("description") || null, timeZone: form.get("timeZone") }) });
      const created = await response.json().catch(() => ({})) as { id?: string; error?: string };
      if (!response.ok || !created.id) throw new Error(created.error ?? "Class could not be created. Please try again.");
      setOpen(false);
      router.push(`/admin/classes/${created.id}`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Class could not be created. Please try again."); }
    finally { setPending(false); }
  }

  return <>
    <Button onClick={() => setOpen(true)}><Plus className="me-2 size-4" aria-hidden="true" />Create class</Button>
    <Dialog open={open} onClose={close} title="Create a class">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex gap-3 rounded-2xl bg-[var(--accent-soft)] p-4"><BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" /><div><p className="text-sm font-semibold">A new space to learn</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Choose a teacher and add the basics. You can add students and schedule sessions next.</p></div></div>
        <fieldset disabled={pending || !teachers.length} className="space-y-4">
          <legend className="sr-only">Class details</legend>
          <label className="block text-sm font-semibold">Class title<input name="title" required maxLength={160} placeholder="e.g. Introduction to web design" className={input} /></label>
          <label className="block text-sm font-semibold">Teacher<select name="ownerId" required defaultValue={teachers.some((teacher) => teacher.id === teacherId) ? teacherId : ""} className={input}><option value="">Select a teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.email}</option>)}</select></label>
          <label className="block text-sm font-semibold">Description <span className="font-normal text-[var(--muted)]">(optional)</span><textarea name="description" rows={3} maxLength={5000} placeholder="What will students learn?" className="mt-2 w-full resize-y rounded-xl border bg-[var(--surface)] p-3 text-sm font-normal" /></label>
          <label className="block text-sm font-semibold">Time zone<input name="timeZone" defaultValue="Asia/Tehran" required maxLength={80} aria-describedby="class-timezone-help" className={input} /></label>
          <p id="class-timezone-help" className="text-xs leading-5 text-[var(--muted)]">Used for class schedules. Enter a time zone such as Asia/Tehran or Europe/London.</p>
        </fieldset>
        {!teachers.length && <p role="status" className="rounded-xl border p-3 text-sm text-[var(--muted)]">Add an active teacher before creating your first class.</p>}
        {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-5"><Button type="button" variant="outline" disabled={pending} onClick={close}>Cancel</Button><Button disabled={pending || !teachers.length}>{pending && <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" />}{pending ? "Creating…" : "Create class"}</Button></div>
      </form>
    </Dialog>
  </>;
}
