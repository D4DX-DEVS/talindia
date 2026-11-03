import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

/** Same column count and page-size rows as the table it stands in for. */
export function TableSkeleton({ columns, rows = 10 }: TableSkeletonProps) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-lg border bg-card">
      <div className="grid gap-4 border-b bg-muted/50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-4 border-b px-4 py-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={c === 0 ? "h-4 w-5/6" : "h-4 w-1/2"} />
          ))}
        </div>
      ))}
    </div>
  );
}
