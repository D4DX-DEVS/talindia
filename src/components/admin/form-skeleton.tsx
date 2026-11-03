import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton() {
  return (
    <div role="status" aria-label="Loading form" className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 rounded-xl border bg-card p-6 xl:col-span-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className={i === 3 ? "h-28 w-full" : "h-10 w-full"} />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
