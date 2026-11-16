import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
export default function ForgotPasswordPage() { return <main className="grid min-h-screen place-items-center px-6"><section className="w-full max-w-md rounded-2xl border bg-white p-8"><Link href="/sign-in" className="text-sm font-medium text-blue-700">← Sign in</Link><h1 className="mt-6 text-3xl font-semibold">Reset your password</h1><p className="mt-2 text-slate-600">Enter your email and we’ll send a one-time recovery link.</p><ForgotPasswordForm /></section></main>; }

