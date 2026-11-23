"use client";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, CalendarDays, ChevronDown, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserProfileEditor } from "@/components/admin-user-tools";
import { PERMISSIONS } from "@/server/permissions";

const input = "h-10 w-full rounded-xl border bg-transparent px-3 text-sm";
async function api(url: string, init: RequestInit) { const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } }); const payload = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Request could not be completed"); return payload; }
function Feedback({ value }: { value: string }) { return value ? <p role="status" className="mt-3 rounded-xl border px-3 py-2 text-sm text-[var(--muted)]">{value}</p> : null; }

type RoleRow = { id: string; key: string; name: string; description: string | null; isSystem: boolean; permissions: Array<{ permissionKey: string }>; _count: { users: number } };
export function RoleManager({ roles }: { roles: RoleRow[] }) {
  const router = useRouter(); const [search, setSearch] = useState(""); const [message, setMessage] = useState(""); const [selected, setSelected] = useState(roles[0]?.id ?? ""); const current = roles.find((role) => role.id === selected); const groups = useMemo(() => Map.groupBy(PERMISSIONS.filter((permission) => `${permission.key} ${permission.description}`.toLowerCase().includes(search.toLowerCase())), (permission) => permission.resource), [search]);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await api("/api/admin/roles", { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description") }) }); setMessage("Role created."); router.refresh(); event.currentTarget.reset(); } catch (error) { setMessage((error as Error).message); } }
  async function savePermissions(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!current) return; const keys = new FormData(event.currentTarget).getAll("permission"); try { await api(`/api/admin/roles/${current.id}`, { method: "PATCH", body: JSON.stringify({ action: "permissions", permissionKeys: keys }) }); setMessage("Permissions updated. Changes apply on the next protected request."); router.refresh(); } catch (error) { setMessage((error as Error).message); } }
  async function remove() { if (!current || !window.confirm(`Delete ${current.name}?`)) return; try { await api(`/api/admin/roles/${current.id}`, { method: "DELETE" }); setMessage("Role deleted."); setSelected(roles[0]?.id ?? ""); router.refresh(); } catch (error) { setMessage((error as Error).message); } }
  return <div className="grid gap-6 xl:grid-cols-[340px_1fr]"><aside className="space-y-4"><form onSubmit={create} className="rounded-2xl border bg-[var(--surface)] p-5"><h2 className="font-semibold">Create custom role</h2><input name="name" required placeholder="Role name" className={`mt-4 ${input}`} /><textarea name="description" placeholder="Description" className="mt-3 w-full rounded-xl border bg-transparent p-3 text-sm" /><button className="mt-3 h-10 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white">Create role</button></form><div className="rounded-2xl border bg-[var(--surface)] p-2">{roles.map((role) => <button key={role.id} onClick={() => setSelected(role.id)} className={`w-full rounded-xl p-3 text-left ${selected === role.id ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-muted)]"}`}><span className="block text-sm font-semibold">{role.name}{role.isSystem ? " · system" : ""}</span><span className="mt-1 block text-xs text-[var(--muted)]">{role._count.users} users · {role.permissions.length} permissions</span></button>)}</div></aside>{current && <section className="rounded-2xl border bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--accent)]">{current.key}</p><h2 className="mt-1 text-2xl font-semibold">{current.name}</h2><p className="mt-2 text-sm text-[var(--muted)]">{current.description ?? "No role description."}</p></div>{!current.isSystem && <button onClick={remove} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700">Delete unused role</button>}</div><label className="mt-6 block text-sm font-semibold">Search permissions<input value={search} onChange={(event) => setSearch(event.target.value)} className={`mt-2 ${input}`} placeholder="Search key or capability" /></label><form onSubmit={savePermissions} className="mt-6 space-y-6">{[...groups.entries()].map(([group, permissions]) => <fieldset key={group}><legend className="text-sm font-bold uppercase tracking-[.12em] text-[var(--accent)]">{group}</legend><div className="mt-3 grid gap-2 lg:grid-cols-2">{permissions.map((permission) => <label key={permission.key} className="flex gap-3 rounded-xl border p-3"><input name="permission" value={permission.key} type="checkbox" defaultChecked={current.permissions.some((item) => item.permissionKey === permission.key)} className="mt-1 size-4 accent-[var(--accent)]" /><span><span className="block text-sm font-semibold">{permission.key}{permission.sensitive ? " · Sensitive" : ""}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{permission.description}</span></span></label>)}</div></fieldset>)}<button className="h-10 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white">Save permission matrix</button></form><Feedback value={message} /></section>}</div>;
}

type UserRow = { id: string; name: string; email: string; locale: string; emailVerified: boolean; disabledAt: Date | string | null; roles: Array<{ role: { id: string; key: string; name: string } }>; _count: { ownedClasses: number; enrollments: number } };
export function UserManager({ users, roles, permissions }: { users: UserRow[]; roles: Array<{ id: string; name: string; key: string }>; permissions: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState("");
  const editing = users.find((user) => user.id === editingId);
  const can = (permission: string) => permissions.includes(permission);

  async function action(userId: string, body: object, success: string) {
    setBusy(true);
    try { await api(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(body) }); setMessage(success); router.refresh(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(user: UserRow) {
    if (!window.confirm(`Permanently delete ${user.email}? Historical dependencies will block unsafe deletion.`)) return;
    setBusy(true);
    try { await api(`/api/admin/users/${user.id}`, { method: "DELETE" }); setMessage("User deleted."); router.refresh(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <>
    <Feedback value={message} />
    <div className="space-y-3">
      {!users.length && <div className="rounded-2xl border border-dashed bg-[var(--surface)] px-6 py-12 text-center"><Users aria-hidden="true" className="mx-auto size-8 text-[var(--muted)]" /><h3 className="mt-4 font-semibold">No accounts found</h3><p className="mt-2 text-sm text-[var(--muted)]">Try another search or create a new user.</p></div>}
      {users.map((user) => <details key={user.id} className="group rounded-2xl border bg-[var(--surface)] open:shadow-sm">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)] font-semibold text-[var(--accent)]">{user.name.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{user.name}</p><p className="mt-1 break-all text-sm text-[var(--muted)]">{user.email}</p></div>
          <div className="flex flex-wrap items-center gap-2">{user.roles.map(({ role }) => <StatusBadge key={role.id} tone="accent">{role.name}</StatusBadge>)}<StatusBadge tone={user.disabledAt ? "neutral" : "success"}>{user.disabledAt ? "Deactivated" : "Active"}</StatusBadge><ChevronDown aria-hidden="true" className="size-4 text-[var(--muted)] transition group-open:rotate-180" /></div>
        </summary>
        <div className="grid gap-6 border-t p-5 lg:grid-cols-3">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Profile & access</h3>
            <p className="text-xs text-[var(--muted)]">Email {user.emailVerified ? "verified" : "awaiting verification"}</p>
            {can("users.update") && <Button variant="outline" size="sm" disabled={busy} onClick={() => setEditingId(user.id)}><Pencil className="me-2 size-3.5" aria-hidden="true" />Edit profile</Button>}
            {roles.length > 0 && <fieldset disabled={busy || !can("roles.assign")} className="space-y-2"><legend className="mb-2 text-xs font-semibold text-[var(--muted)]">Assigned roles</legend>{roles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={user.roles.some((item) => item.role.id === role.id)} onChange={(event) => void action(user.id, { action: "role", roleId: role.id, assigned: event.target.checked }, "Role assignment updated.")} className="size-4 accent-[var(--accent)]" />{role.name}</label>)}</fieldset>}
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Security</h3>
            <div className="flex flex-col items-start gap-2">
              {can("users.password.reset.send") && <Button variant="outline" size="sm" disabled={busy} onClick={() => void action(user.id, { action: "reset" }, "Password-reset email accepted by the configured delivery service.")}>Send password reset</Button>}
              {can("users.password.set") && <Button variant="outline" size="sm" disabled={busy} onClick={() => { const password = window.prompt("Enter a new password (minimum 8 characters)"); if (password) void action(user.id, { action: "password", password }, "Password changed and sessions revoked."); }}>Set password</Button>}
              {can("users.email.update") && <Button variant="outline" size="sm" disabled={busy} onClick={() => { const email = window.prompt("New email", user.email); if (email && email !== user.email) void action(user.id, { action: "email", email }, "Email changed, marked unverified, and sessions revoked."); }}>Change email</Button>}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Account status</h3>
            <p className="text-xs leading-5 text-[var(--muted)]">{user._count.ownedClasses} owned classes · {user._count.enrollments} enrollments</p>
            <div className="flex flex-col items-start gap-2">
              {can("users.status.update") && <Button variant="outline" size="sm" disabled={busy} onClick={() => void action(user.id, { action: "status", disabled: !user.disabledAt }, user.disabledAt ? "Account reactivated." : "Account deactivated and sessions revoked.")}>{user.disabledAt ? "Reactivate account" : "Deactivate account"}</Button>}
              {can("users.delete") && <Button variant="outline" size="sm" disabled={busy} onClick={() => void remove(user)} className="border-[var(--danger)]/30 text-[var(--danger)]">Delete permanently</Button>}
            </div>
          </section>
        </div>
      </details>)}
    </div>
    {editing && <UserProfileEditor key={editing.id} user={editing} onClose={() => setEditingId("")} onSaved={() => { setEditingId(""); setMessage("Profile details updated."); router.refresh(); }} />}
  </>;
}

type ClassRow = { id: string; title: string; status: string; timeZone: string; owner: { id: string; name: string; email: string }; _count: { enrollments: number; classSessions: number } };
export function ClassManager({ classes }: { classes: ClassRow[] }) {
  if (!classes.length) return <div className="rounded-2xl border border-dashed bg-[var(--surface)] px-6 py-14 text-center"><BookOpen aria-hidden="true" className="mx-auto size-9 text-[var(--muted)]" /><h2 className="mt-4 text-lg font-semibold">No classes found</h2><p className="mt-2 text-sm text-[var(--muted)]">Create a class for this teacher or adjust your filters.</p></div>;
  return <div className="grid gap-4 xl:grid-cols-2">{classes.map((item) => <Link key={item.id} href={`/admin/classes/${item.id}`} className="group flex min-w-0 flex-col rounded-2xl border bg-[var(--surface)] p-5 transition hover:border-[var(--accent)] hover:shadow-md sm:p-6">
    <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><BookOpen className="size-5" aria-hidden="true" /></span><StatusBadge tone={item.status === "ACTIVE" ? "success" : item.status === "DRAFT" ? "warning" : "neutral"}>{item.status === "ACTIVE" ? "Active" : item.status === "DRAFT" ? "Draft" : "Archived"}</StatusBadge></div>
    <h2 className="mt-5 break-words text-lg font-semibold group-hover:text-[var(--accent)]">{item.title}</h2>
    <p className="mt-1 break-words text-sm text-[var(--muted)]">{item.owner.name} · {item.timeZone}</p>
    <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]"><span className="inline-flex items-center gap-2"><Users aria-hidden="true" className="size-4" />{item._count.enrollments} students</span><span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" />{item._count.classSessions} sessions</span></div>
    <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-semibold text-[var(--accent)]">Open class workspace<ArrowUpRight aria-hidden="true" className="size-4" /></div>
  </Link>)}</div>;
}
