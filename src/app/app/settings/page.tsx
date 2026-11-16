import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAuthenticatedUser } from "@/server/authorization";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch { redirect("/sign-in"); }
  return <WorkspaceShell title="Account settings"><div className="max-w-3xl"><Link href="/app" className="text-sm font-semibold text-[var(--accent)]">← Back to workspace</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight">Account settings</h1><p className="mt-2 text-[var(--muted)]">Signed in as {user.email}</p><div className="mt-8 rounded-2xl border bg-[var(--surface)] p-5 shadow-sm"><AccountSettings /></div></div></WorkspaceShell>;
}

