import type { ReactNode } from "react";

export function Notice({ tone = "info", title, children }: { tone?: "info" | "success" | "warning"; title: string; children: ReactNode }) {
  const colors = { info: "border-[var(--accent)]/30 bg-[var(--accent-soft)]", success: "border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]", warning: "border-[var(--warning)]/30 bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))]" };
  return <div role="status" className={`rounded-2xl border p-4 ${colors[tone]}`}><p className="text-sm font-semibold">{title}</p><div className="mt-1 text-sm leading-6 text-[var(--muted)]">{children}</div></div>;
}
