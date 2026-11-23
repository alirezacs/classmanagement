"use client";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) { event.preventDefault(); ref.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeRef.current()}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl sm:max-w-lg sm:p-6"><div className="flex items-center justify-between gap-3"><h2 id={titleId} className="min-w-0 truncate text-lg font-semibold">{title}</h2><button type="button" onClick={() => closeRef.current()} className="shrink-0 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)]" aria-label="Close dialog"><X className="size-4" /></button></div><div className="mt-5 min-w-0">{children}</div></div></div>;
}

