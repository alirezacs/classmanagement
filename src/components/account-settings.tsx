"use client";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountSettings() {
  const [message, setMessage] = useState<string>(); const [pending, setPending] = useState(false);
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(undefined);
    const data = new FormData(event.currentTarget);
    const result = await authClient.changePassword({ currentPassword: String(data.get("currentPassword")), newPassword: String(data.get("newPassword")), revokeOtherSessions: true });
    setPending(false); setMessage(result.error ? "Unable to change password." : "Password changed. Other sessions were signed out.");
  }
  return <section className="mt-8 border-t pt-8"><h2 className="text-lg font-semibold">Password and sessions</h2><form onSubmit={changePassword} className="mt-4 max-w-md space-y-4"><label className="block text-sm font-medium">Current password<input name="currentPassword" type="password" required className="mt-2 h-10 w-full rounded-lg border px-3" /></label><label className="block text-sm font-medium">New password<input name="newPassword" type="password" minLength={8} required className="mt-2 h-10 w-full rounded-lg border px-3" /></label><Button disabled={pending}>{pending ? "Saving…" : "Change password"}</Button>{message && <p className="text-sm text-slate-600" role="status">{message}</p>}</form></section>;
}

