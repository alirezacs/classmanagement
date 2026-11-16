"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function NewClassPage() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(undefined); const data = new FormData(event.currentTarget); const response = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.get("title"), description: data.get("description") || null, timeZone: data.get("timeZone"), startsOn: data.get("startsOn") || null, endsOn: data.get("endsOn") || null }) }); if (!response.ok) { setError("Could not create this class."); setPending(false); return; } const created = await response.json() as { id: string }; router.push(`/app/classes/${created.id}`); }
  return <WorkspaceShell title="Create class"><div className="max-w-2xl"><PageHeader eyebrow="Teaching" title="Create a class" description="Set the class basics now; you can invite students once it is ready." /><form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border bg-[var(--surface)] p-6"><label className="block text-sm font-semibold">Class title<input name="title" required maxLength={160} className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3 font-normal" /></label><label className="block text-sm font-semibold">Description<textarea name="description" rows={4} className="mt-2 w-full rounded-xl border bg-transparent p-3 font-normal" /></label><label className="block text-sm font-semibold">IANA timezone<input name="timeZone" defaultValue="Asia/Tehran" required className="mt-2 h-11 w-full rounded-xl border bg-transparent px-3 font-normal" /></label>{error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}<div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button><Button disabled={pending}>{pending ? "Creating…" : "Create class"}</Button></div></form></div></WorkspaceShell>;
}
