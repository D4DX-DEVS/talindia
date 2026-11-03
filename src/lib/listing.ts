import { z } from "zod";

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface ListingQuery<S extends string> {
  page: number;
  pageSize: PageSize;
  search: string;
  sort: S;
  order: "asc" | "desc";
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/**
 * Normalises URL search params for a listing. Invalid values fall back to defaults instead of
 * erroring so that a hand-edited URL still renders something sensible.
 */
export function parseListing<S extends string>(
  params: RawParams,
  opts: { sorts: readonly S[]; defaultSort: S; defaultOrder?: "asc" | "desc"; defaultPageSize?: PageSize },
): ListingQuery<S> {
  const page = z.coerce.number().int().min(1).max(10_000).catch(1).parse(first(params.page));
  const sizeRaw = Number(first(params.pageSize));
  const pageSize = (PAGE_SIZES as readonly number[]).includes(sizeRaw) ? (sizeRaw as PageSize) : (opts.defaultPageSize ?? 20);
  const search = (first(params.search) ?? first(params.q) ?? "").trim().slice(0, 100);
  const sortRaw = first(params.sort);
  const sort = opts.sorts.includes(sortRaw as S) ? (sortRaw as S) : opts.defaultSort;
  const orderRaw = first(params.order);
  const order = orderRaw === "asc" || orderRaw === "desc" ? orderRaw : (opts.defaultOrder ?? "desc");
  return { page, pageSize, search, sort, order };
}

export function pickEnum<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  const v = first(value);
  return allowed.includes(v as T) ? (v as T) : undefined;
}

export function paginate<T>(data: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { data, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Escapes LIKE wildcards; pair with `ESCAPE '\\'` in the query. */
export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
