"use client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function ConfirmationDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; onConfirm?: () => void }) {
  return <Dialog open={open} onClose={() => onOpenChange(false)} title={title}><p className="mb-5 text-sm leading-6 text-[var(--muted)]">{description}</p><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onConfirm?.(); onOpenChange(false); }}>{confirmLabel}</Button></div></Dialog>;
}
