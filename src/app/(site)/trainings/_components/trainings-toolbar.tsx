"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "open", label: "Enrolling" },
  { value: "closed", label: "Closed" },
];

export function TrainingsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const status = params.get("status") ?? "all";

  const apply = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  useEffect(() => {
    // Navigate only when the typed value differs from the URL (StrictMode re-runs effects on mount).
    if (search.trim() === (params.get("search") ?? "")) return;
    const t = setTimeout(() => apply({ search: search.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the debounced value should trigger navigation
  }, [search]);

  const active = Boolean(params.get("search") || params.get("status"));

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); apply({ search: search.trim() }); }} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="training-search" className="sr-only">Search trainings</label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-soft" aria-hidden />
        <input
          id="training-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, role or skill"
          className="h-12 w-full bg-paper pr-10 pl-12 text-base text-ink ring-1 ring-ink/15 placeholder:text-soft focus-visible:ring-2 focus-visible:ring-violet focus-visible:outline-none"
        />
        {pending && <Loader2 className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-soft" aria-hidden />}
      </div>
      <Select value={status} onValueChange={(v) => apply({ status: v })}>
        <SelectTrigger aria-label="Filter by status" className="h-12 w-full rounded-none border-0 bg-paper text-base ring-1 ring-ink/15 data-[size=default]:h-12 sm:w-52">
          <SelectValue>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className="min-h-10">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active && (
        <button
          type="button"
          onClick={() => { setSearch(""); startTransition(() => router.replace(pathname, { scroll: false })); }}
          className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-5 text-base font-semibold text-white hover:bg-indigo"
        >
          <X className="size-4" aria-hidden /> Clear filters
        </button>
      )}
    </form>
  );
}
