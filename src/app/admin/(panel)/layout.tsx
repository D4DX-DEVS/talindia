import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Talindia admin", robots: { index: false, follow: false } };

/** Nothing under (panel) renders until the session is verified against D1. */
async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-svh bg-muted/40">
      <AdminSidebar email={session.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar email={session.email} />
        <main id="content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh bg-muted/40" role="status" aria-label="Loading admin">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <Skeleton className="mb-8 h-6 w-32" />
        {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="mb-3 h-8 w-full" />)}
      </div>
      <div className="flex-1 space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
