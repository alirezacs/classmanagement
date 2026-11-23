"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>();
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")); const password = String(data.get("password")); setVerificationEmail(email);
    const invite = searchParams.get("invite");
    const result = mode === "sign-in"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name: String(data.get("name")), callbackURL: invite ? `/invite/${encodeURIComponent(invite)}` : "/" });
    setPending(false);
    if (result.error) setError(result.error.message ?? "Unable to continue.");
    else if (invite && mode === "sign-in") {
      const acceptance = await fetch("/api/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: invite }) });
      if (!acceptance.ok) setError("This invitation cannot be accepted with this account.");
      else router.push("/app");
    } else {
      const intended = searchParams.get("next");
      router.push(intended?.startsWith("/") && !intended.startsWith("//") ? intended : "/app");
    }
  }
  async function resendVerification() { setPending(true); setError(undefined); setVerificationSent(false); const response = await fetch("/api/auth/send-verification-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: verificationEmail, callbackURL: "/app" }) }); setPending(false); if (response.ok) setVerificationSent(true); else setError(response.status === 429 ? "Too many requests. Please wait before trying again." : "We could not send a verification email."); }
  return <form onSubmit={submit} className="mt-8 space-y-5">
    {mode === "register" && <label className="block text-sm font-medium">Name<input name="name" required autoComplete="name" className="mt-2 h-11 w-full rounded-lg border bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>}
    <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 h-11 w-full rounded-lg border bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>
    <label className="block text-sm font-medium">Password<input name="password" type="password" minLength={8} required autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="mt-2 h-11 w-full rounded-lg border bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>
    {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><p>{error}</p>{mode === "sign-in" && verificationEmail && (resultLooksUnverified(error) || error.toLowerCase().includes("verify")) && <button type="button" className="mt-2 font-semibold underline" onClick={resendVerification} disabled={pending}>Resend verification email</button>}</div>}
    {verificationSent && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Verification email sent. Check your inbox, then return here to sign in.</p>}
    <Button className="w-full" disabled={pending}>{pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</Button>
    <p className="text-center text-sm text-slate-600">{mode === "sign-in" ? <>New here? <Link className="font-medium text-blue-700" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-medium text-blue-700" href="/sign-in">Sign in</Link></>}</p>
  </form>;
}

function resultLooksUnverified(message: string): boolean { const value = message.toLowerCase(); return value.includes("not verified") || value.includes("email verification") || value.includes("email_not_verified"); }

