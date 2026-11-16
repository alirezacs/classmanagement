import Link from "next/link";
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="grid min-h-screen place-items-center px-6"><section className="w-full max-w-md rounded-2xl border bg-white p-8"><h1 className="text-3xl font-semibold">You’re invited to a class</h1><p className="mt-3 text-slate-600">Sign in with the email address that received the invitation. New students should create their account first, then return here to accept.</p><div className="mt-7 flex gap-3"><Link className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white" href={`/sign-in?invite=${encodeURIComponent(token)}`}>Sign in</Link><Link className="rounded-lg border px-4 py-2 text-sm font-medium" href={`/register?invite=${encodeURIComponent(token)}`}>Create student account</Link></div></section></main>;
}

