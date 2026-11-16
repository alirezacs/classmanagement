import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";
export default function RegisterPage() { return <main className="grid min-h-screen place-items-center px-6 py-12"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><Link href="/" className="text-sm font-medium text-blue-700">← Classroom</Link><h1 className="mt-6 text-3xl font-semibold">Create your account</h1><p className="mt-2 text-slate-600">Teachers can create an account; student class access requires an invitation.</p><Suspense><AuthForm mode="register" /></Suspense></section></main>; }

