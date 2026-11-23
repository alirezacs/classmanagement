import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({ pathname, query, page, pageSize, total }: { pathname: string; query: Record<string, string | undefined>; page: number; pageSize: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1 && page === 1) return null;
  function href(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    params.set("page", String(nextPage));
    return `${pathname}?${params}`;
  }
  return <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
    <p className="text-[var(--muted)]">Page {page} of {pages} · {total} results</p>
    <div className="flex gap-2">
      {page > 1 && <Button asChild variant="outline" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>}
      {page < pages && <Button asChild variant="outline" size="sm"><Link href={href(page + 1)}>Next</Link></Button>}
    </div>
  </nav>;
}
