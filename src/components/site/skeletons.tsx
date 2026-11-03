import { cn } from "@/lib/utils";

/** Shimmer block: a tone step with a moving highlight (transform only). */
export function Shimmer({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden", dark ? "bg-night-soft" : "bg-field", className)}>
      <div className={cn("absolute inset-0 animate-shimmer", dark ? "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" : "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]")} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="bg-ground">
      <div className="frame flex min-h-[calc(100svh-4.5rem)] flex-col items-center pt-10">
        <Shimmer className="h-[13vw] w-[80%] max-w-5xl" />
        <Shimmer className="mt-4 h-[13vw] w-[60%] max-w-4xl" />
        <Shimmer className="mt-8 aspect-[3/4] w-[60vw] max-w-[440px] sm:w-[27vw]" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="frame py-16 sm:py-24" aria-hidden>
      <Shimmer className="h-14 w-2/3 max-w-2xl sm:h-20" />
      <Shimmer className="mt-6 h-6 w-full max-w-xl" />
      <Shimmer className="mt-3 h-6 w-4/5 max-w-lg" />
    </div>
  );
}

export function CourseListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading trainings" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[120px_1fr] gap-5 bg-paper p-4 sm:grid-cols-[200px_1fr_auto] sm:p-5">
          <Shimmer className="aspect-[3/2] w-full" />
          <div className="space-y-3 py-1">
            <Shimmer className="h-6 w-3/4" />
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-4 w-2/3" />
          </div>
          <Shimmer className="hidden h-8 w-28 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="bg-ground">
      <PageHeaderSkeleton />
      <div className="frame grid gap-10 pb-24 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {Array.from({ length: 6 }, (_, i) => (
            <Shimmer key={i} className={cn("h-5", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
        </div>
        <Shimmer className="aspect-[4/3] w-full lg:col-span-5" />
      </div>
    </div>
  );
}
