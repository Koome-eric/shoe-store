import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CatalogPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-sm border border-border ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:border-clay"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
        .map((p, idx, arr) => (
          <span key={p} className="flex items-center">
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={hrefFor(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-sm border text-sm font-medium ${
                p === page ? "border-clay bg-clay text-bone" : "border-border hover:border-clay"
              }`}
            >
              {p}
            </Link>
          </span>
        ))}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-sm border border-border ${
          page === totalPages ? "pointer-events-none opacity-40" : "hover:border-clay"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
