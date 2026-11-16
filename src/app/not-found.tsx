import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="grid min-h-screen place-items-center px-6 text-center"><div><p className="text-sm font-semibold text-blue-700">404</p><h1 className="mt-2 text-3xl font-semibold">Page not found</h1><p className="mt-3 text-slate-600">The page may have moved or you may not have access.</p><Button asChild className="mt-6"><Link href="/">Return home</Link></Button></div></main>; }

