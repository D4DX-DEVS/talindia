import { Suspense } from "react";
import Link from "next/link";
import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { GraduationCap, HardDrive, Inbox, Mail } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/states";
import { getDb } from "@/db/client";
import { activityLog, courses, enquiries, media, subscribers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { formatBytes, formatDateTime } from "@/lib/format";

async function loadDashboard() {
  await requireAdmin();
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    [published],
    [drafts],
    [newEnq],
    [enq30],
    [subs],
    [mediaStats],
    recentEnquiries,
    recentActivity,
    weekly,
  ] = await Promise.all([
    db.select({ n: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ n: count() }).from(courses).where(eq(courses.status, "draft")),
    db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new")),
    db.select({ n: count() }).from(enquiries).where(gte(enquiries.createdAt, since)),
    db.select({ n: count() }).from(subscribers).where(eq(subscribers.status, "subscribed")),
    db.select({ n: count(), bytes: sum(media.size) }).from(media),
    db
      .select({ id: enquiries.id, name: enquiries.name, subject: enquiries.subject, status: enquiries.status, createdAt: enquiries.createdAt })
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt))
      .limit(5),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(8),
    db
      .select({ week: sql<string>`strftime('%Y-%W', ${enquiries.createdAt}, 'unixepoch')`, n: count() })
      .from(enquiries)
      .where(and(gte(enquiries.createdAt, new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);
  return {
    published: published.n,
    drafts: drafts.n,
    newEnquiries: newEnq.n,
    enquiries30: enq30.n,
    subscribers: subs.n,
    mediaCount: mediaStats.n,
    mediaBytes: Number(mediaStats.bytes ?? 0),
    recentEnquiries,
    recentActivity,
    weekly,
  };
}

function Stat({ icon: Icon, label, value, sub, href }: { icon: typeof Inbox; label: string; value: string | number; sub: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 sm:size-5" aria-hidden />
        <span className="truncate text-xs sm:text-sm">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}

async function Dashboard() {
  const d = await loadDashboard();
  const max = Math.max(1, ...d.weekly.map((w) => w.n));
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={Inbox} label="New enquiries" value={d.newEnquiries} sub={`${d.enquiries30} in the last 30 days`} href="/admin/enquiries/?status=new" />
        <Stat icon={GraduationCap} label="Published trainings" value={d.published} sub={`${d.drafts} draft${d.drafts === 1 ? "" : "s"}`} href="/admin/courses/" />
        <Stat icon={Mail} label="Subscribers" value={d.subscribers} sub="Footer newsletter sign-ups" href="/admin/subscribers/" />
        <Stat icon={HardDrive} label="Media files" value={d.mediaCount} sub={formatBytes(d.mediaBytes)} href="/admin/media/" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="recent-enq">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-enq" className="font-semibold">Latest enquiries</h2>
            <Link href="/admin/enquiries/" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {d.recentEnquiries.length ? (
            <ul className="divide-y">
              {d.recentEnquiries.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}/`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{e.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{e.subject}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                      <span className="block font-medium capitalize text-foreground">{e.status.replace("_", " ")}</span>
                      {formatDateTime(e.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No enquiries yet" description="Messages sent from the contact and training forms appear here." className="py-8" />
          )}
          {d.weekly.length > 0 && (
            <figure className="mt-6">
              <figcaption className="mb-2 text-sm text-muted-foreground">Enquiries per week (last 8 weeks)</figcaption>
              <div className="flex h-24 items-end gap-2" role="img" aria-label={d.weekly.map((w) => `${w.week}: ${w.n}`).join(", ")}>
                {d.weekly.map((w) => (
                  <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs tabular-nums">{w.n}</span>
                    <div className="w-full rounded-t bg-indigo" style={{ height: `${(w.n / max) * 64}px` }} />
                  </div>
                ))}
              </div>
            </figure>
          )}
        </section>
        <section className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="recent-activity">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-activity" className="font-semibold">Recent activity</h2>
            <Link href="/admin/activity/" className="text-sm text-primary hover:underline">View log</Link>
          </div>
          <ul className="divide-y">
            {d.recentActivity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{a.action}</span>
                  {a.summary && <span className="block truncate text-muted-foreground">{a.summary}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <AdminPageHeader title="Dashboard" description="Live figures from the website database." />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}
