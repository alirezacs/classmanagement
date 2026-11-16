import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";
export default function SignInPage() { return <main className="grid min-h-screen place-items-center px-6 py-12"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><Link href="/" className="text-sm font-medium text-blue-700">← Classroom</Link><h1 className="mt-6 text-3xl font-semibold">Welcome back</h1><p className="mt-2 text-slate-600">Sign in to your private class workspace.</p><Suspense><AuthForm mode="sign-in" /></Suspense></section></main>; }

