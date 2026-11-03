"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAGE_SIZES } from "@/lib/listing";
import { cn } from "@/lib/utils";

interface DataPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  className?: string;
  /** "site" renders square public-site controls; "admin" uses the default shadcn look. */
  tone?: "site" | "admin";
}

/** Shared pagination: Previous/Next, "Page X of Y", result count, rows-per-page. URL is the source of truth. */
export function DataPagination({ page, pageSize, total, totalPages, className, tone = "admin" }: DataPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const go = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) sp.set(k, v);
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  };

  const btn = tone === "site" ? "min-h-11 rounded-none px-4" : "min-h-10 sm:min-h-8";

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {pending && <Loader2 className="mr-1 inline size-4 animate-spin" aria-hidden />}
        {total} {total === 1 ? "result" : "results"} · Page {Math.min(page, totalPages)} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => go({ pageSize: v, page: "1" })}>
            <SelectTrigger className={cn("w-20", tone === "site" && "rounded-none")} aria-label="Rows per page">
              <SelectValue>{pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button variant="outline" className={btn} disabled={page <= 1 || pending} onClick={() => go({ page: String(page - 1) })}>
          <ChevronLeft aria-hidden /> Previous
        </Button>
        <Button variant="outline" className={btn} disabled={page >= totalPages || pending} onClick={() => go({ page: String(page + 1) })}>
          Next <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
