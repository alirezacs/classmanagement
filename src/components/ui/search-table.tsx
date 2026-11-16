"use client";
import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
export function SearchTable({ rows, empty, children }: { rows: string[]; empty?: ReactNode; children: (visible: string[]) => ReactNode }) { const [query,setQuery]=useState("");const visible=useMemo(()=>rows.filter(row=>row.toLowerCase().includes(query.toLowerCase())),[rows,query]);return <div><div className="relative mb-4 max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search names or records…" aria-label="Search records" className="h-10 w-full rounded-xl border bg-[var(--surface)] pl-9 pr-3 text-sm placeholder:text-[var(--muted)]" /></div>{visible.length?children(visible):empty??<div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--muted)]">No matching records.</div>}</div>; }

