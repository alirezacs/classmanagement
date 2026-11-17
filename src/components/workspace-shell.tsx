"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Settings2, Sun, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavItem = { href: string; activeHref?: string; label: string; icon: LucideIcon; exact?: boolean };

const teacherNav: NavItem[] = [{ href: "/app", label: "Overview", icon: LayoutDashboard, exact: true }, { href: "/app/classes", label: "Classes", icon: BookOpen }];
const studentNav: NavItem[] = [{ href: "/app/student", label: "Overview", icon: LayoutDashboard, exact: true }, { href: "/app/student", activeHref: "/app/student/classes", label: "My classes", icon: BookOpen }];

function isActivePath(pathname: string, href: string, exact = false) {
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}

export function WorkspaceShell({ children, role = "Teacher", title = "Workspace", userName, userEmail }: { children: ReactNode; role?: "Teacher" | "Student"; title?: string; userName?: string; userEmail?: string }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false); const [signingOut, setSigningOut] = useState(false); const { theme, toggle } = useTheme();
  const nav = role === "Student" ? studentNav : teacherNav;
  const handleSignOut = async () => {
    setSigningOut(true);
    const result = await authClient.signOut();
    if (result.error) {
      setSigningOut(false);
      return;
    }
    router.replace("/sign-in");
    router.refresh();
  };
  const initials = (userName ?? "WU").split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
  return <div className="min-h-screen bg-[var(--background)]"><aside className={cn("fixed inset-y-0 left-0 z-40 w-72 border-r bg-[var(--surface)] p-5 transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center justify-between"><Link href="/app" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent)] text-white"><GraduationCap className="size-5" /></span><span><span className="block text-sm font-semibold tracking-tight">Classroom</span><span className="block text-xs text-[var(--muted)]">Academic workspace</span></span></Link><button className="rounded-lg p-2 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="size-5" /></button></div><div className="mt-9 rounded-2xl bg-[var(--accent-soft)] p-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Current view</p><p className="mt-1 text-sm font-semibold">{role} dashboard</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Private data from your authorized workspace.</p></div><nav className="mt-7 space-y-1" aria-label="Workspace navigation">{nav.map((item) => { const Icon = item.icon; const active = isActivePath(pathname, item.activeHref ?? item.href, item.exact); return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]")}><Icon className="size-4" />{item.label}</Link>; })}</nav><div className="absolute inset-x-5 bottom-5 space-y-1"><Link href="/app/settings" aria-current={isActivePath(pathname, "/app/settings") ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", isActivePath(pathname, "/app/settings") ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]")}><Settings2 className="size-4" />Account settings</Link><button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-muted)]">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}{theme === "dark" ? "Light theme" : "Dark theme"}</button><button type="button" disabled={signingOut} onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--danger)] disabled:cursor-wait disabled:opacity-60"><LogOut className="size-4" />{signingOut ? "Signing out…" : "Log out"}</button></div></aside>{open && <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close navigation overlay" onClick={() => setOpen(false)} />}<div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-5 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button className="rounded-xl border bg-[var(--surface)] p-2 lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu className="size-5" /></button><div><p className="text-xs text-[var(--muted)]">{title}</p><div className="flex items-center gap-1 text-sm font-semibold"><Link href="/app" className="hover:text-[var(--accent)]">Workspace</Link><ChevronRight className="size-3 text-[var(--muted)]" /><span>{role}</span></div></div></div><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-semibold">{userName ?? "Workspace user"}</span><span className="block text-xs text-[var(--muted)]">{userEmail ?? "Signed in"}</span></span><span className="grid size-9 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">{initials}</span></div></header><main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main></div></div>;
}


