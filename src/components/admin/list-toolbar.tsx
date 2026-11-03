"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ToolbarFilter {
  param: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ListToolbarProps {
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  sorts?: { value: string; label: string }[];
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
}

/** Search (debounced 300ms), filter selects and sort — all written to the URL; any change resets page to 1. */
export function ListToolbar({ searchPlaceholder = "Search…", filters = [], sorts = [], defaultSort, defaultOrder = "desc" }: ListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const apply = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  useEffect(() => {
    // Navigate only when the typed value differs from the URL (StrictMode re-runs effects on mount).
    if (search.trim() === (params.get("search") ?? "")) return;
    const t = setTimeout(() => apply({ search: search.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the debounced value drives navigation
  }, [search]);

  const sort = params.get("sort") ?? defaultSort ?? sorts[0]?.value ?? "";
  const order = (params.get("order") as "asc" | "desc" | null) ?? defaultOrder;
  const active = Boolean(params.get("search")) || filters.some((f) => params.get(f.param));

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 bg-card pl-9"
        />
        {pending && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />}
      </div>
      {filters.map((f) => (
        <Select key={f.param} value={params.get(f.param) ?? "all"} onValueChange={(v) => apply({ [f.param]: v })}>
          <SelectTrigger aria-label={f.label} className="h-10 w-full bg-card data-[size=default]:h-10 sm:w-44" data-active={Boolean(params.get(f.param))}>
            <SelectValue>{params.get(f.param) ? f.options.find((o) => o.value === params.get(f.param))?.label : `All ${f.label.toLowerCase()}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{`All ${f.label.toLowerCase()}`}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {sorts.length > 0 && (
        <div className="flex gap-2">
          <Select value={sort} onValueChange={(v) => apply({ sort: v })}>
            <SelectTrigger aria-label="Sort by" className="h-10 w-full bg-card data-[size=default]:h-10 sm:w-44">
              <SelectValue>{`Sort: ${sorts.find((s) => s.value === sort)?.label ?? ""}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value}>{`Sort: ${s.label}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="size-10 bg-card"
            aria-label={order === "asc" ? "Ascending, switch to descending" : "Descending, switch to ascending"}
            onClick={() => apply({ order: order === "asc" ? "desc" : "asc" })}
          >
            {order === "asc" ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
          </Button>
        </div>
      )}
      {active && (
        <Button
          type="button"
          variant="ghost"
          className="h-10"
          onClick={() => {
            setSearch("");
            startTransition(() => router.replace(pathname));
          }}
        >
          <X aria-hidden /> Clear filters
        </Button>
      )}
    </div>
  );
}
