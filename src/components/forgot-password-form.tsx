"use client";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [complete, setComplete] = useState(false); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true);
    const email = String(new FormData(event.currentTarget).get("email"));
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false); setComplete(true);
  }
  if (complete) return <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">If an account matches that address, recovery instructions have been sent.</p>;
  return <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 h-11 w-full rounded-lg border px-3" /></label><Button className="w-full" disabled={pending}>{pending ? "Sending…" : "Send recovery instructions"}</Button></form>;
}

