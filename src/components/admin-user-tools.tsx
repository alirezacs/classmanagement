"use client";

import { Check, GraduationCap, LoaderCircle, Pencil, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const input = "mt-2 h-11 w-full rounded-xl border bg-[var(--surface)] px-3 text-sm font-normal disabled:opacity-60";

export function UserCreator({ teacherRoleId, variant = "default" }: { teacherRoleId?: string; variant?: "default" | "outline" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [createdUserId, setCreatedUserId] = useState("");
  const [complete, setComplete] = useState(false);
  const teacher = Boolean(teacherRoleId);
  const Icon = teacher ? GraduationCap : UserPlus;

  function close() {
    if (pending) return;
    setOpen(false);
    setError("");
    setCreatedUserId("");
    setComplete(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    let userId = createdUserId;
    try {
      if (!userId) {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") || undefined }),
        });
        const user = await response.json().catch(() => ({})) as { id?: string; error?: string };
        if (!response.ok || !user.id) throw new Error(user.error ?? "Account could not be created. Please try again.");
        userId = user.id;
        setCreatedUserId(userId);
      }
      if (teacherRoleId) {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "role", roleId: teacherRoleId, assigned: true }),
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Teacher access could not be added.");
      }
      setComplete(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Please try again.";
      setError(userId ? `The account was created, but teacher access is still pending. Retry to finish setup. ${message}` : message);
    } finally {
      if (userId) router.refresh();
      setPending(false);
    }
  }

  return <>
    <Button variant={variant} onClick={() => setOpen(true)}><Icon aria-hidden="true" className="me-2 size-4" />{teacher ? "New teacher" : "New user"}</Button>
    <Dialog open={open} onClose={close} title={teacher ? "Create a teacher" : "Create a user"}>
      {complete ? <div className="py-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Check className="size-7" aria-hidden="true" /></span>
        <h3 className="mt-5 text-xl font-semibold">{teacher ? "Your teacher is ready" : "Account created"}</h3>
        <p role="status" className="mt-2 text-sm leading-6 text-[var(--muted)]">{teacher ? "You can now assign classes to this teacher." : "Manage this account and assign roles in All accounts."} The email still needs verification.</p>
        <Button onClick={close} className="mt-6 w-full">Done</Button>
      </div> : <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--accent-soft)] p-4">
          <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" />
          <div><p className="text-sm font-semibold">{teacher ? "A new member of your teaching team" : "Start with the account basics"}</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{teacher ? "Add their details to set up an account with teacher access." : "Add their details now. You can assign their roles after creation."}</p></div>
        </div>
        <fieldset disabled={pending || Boolean(createdUserId)} className="space-y-4">
          <legend className="sr-only">Account details</legend>
          <label className="block text-sm font-semibold">Full name<input name="name" autoComplete="name" placeholder="e.g. Sara Ahmadi" required maxLength={160} className={input} /></label>
          <label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" placeholder="name@example.com" required maxLength={320} className={input} /></label>
          <label className="block text-sm font-semibold">Initial password <span className="font-normal text-[var(--muted)]">(optional)</span><input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} maxLength={128} aria-describedby="new-user-password-help" className={input} /></label>
          <p id="new-user-password-help" className="text-xs leading-5 text-[var(--muted)]">Leave blank to set a password later from All accounts. No welcome email is sent automatically.</p>
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3 text-sm leading-6 text-[var(--danger)]">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-5">
          <Button type="button" variant="outline" disabled={pending} onClick={close}>Cancel</Button>
          <Button disabled={pending}>{pending && <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" />}{pending ? "Creating…" : createdUserId ? "Retry teacher access" : teacher ? "Create teacher" : "Create user"}</Button>
        </div>
      </form>}
    </Dialog>
  </>;
}

export function UserProfileEditor({ user, onClose, onSaved }: { user: { id: string; name: string; email: string; locale: string }; onClose: () => void; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), locale: form.get("locale") }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Profile could not be updated.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile could not be updated. Please try again.");
    } finally { setPending(false); }
  }

  return <Dialog open onClose={() => { if (!pending) onClose(); }} title="Edit profile">
    <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--surface-muted)] p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)]">{user.name.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="mt-1 break-all text-sm text-[var(--muted)]">{user.email}</p></div>
    </div>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Profile details</legend>
        <label className="block text-sm font-semibold">Display name<input name="name" defaultValue={user.name} autoComplete="name" required maxLength={160} className={input} /></label>
        <label className="block text-sm font-semibold">Locale<input name="locale" defaultValue={user.locale} required minLength={2} maxLength={20} aria-describedby="profile-locale-help" className={input} /></label>
        <p id="profile-locale-help" className="text-xs text-[var(--muted)]">Language code, such as en for English or fa for Persian.</p>
      </fieldset>
      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex justify-end gap-2 border-t pt-5"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button disabled={pending}>{pending ? <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden="true" /> : <Pencil className="me-2 size-4" aria-hidden="true" />}{pending ? "Saving…" : "Save changes"}</Button></div>
    </form>
  </Dialog>;
}
