import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
export function StatusBadge({ status, children, tone = "neutral" }: { status?: string; children?: ReactNode; tone?: "neutral"|"success"|"warning"|"danger"|"accent" }) { return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",tone==="success"&&"border-emerald-200 bg-emerald-50 text-[var(--success)]",tone==="warning"&&"border-amber-200 bg-amber-50 text-[var(--warning)]",tone==="danger"&&"border-rose-200 bg-rose-50 text-[var(--danger)]",tone==="accent"&&"border-violet-200 bg-[var(--accent-soft)] text-[var(--accent)]",tone==="neutral"&&"bg-[var(--surface-muted)] text-[var(--muted)]")}>{children ?? status}</span>; }

