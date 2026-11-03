import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTIVITY_SORTS, activityEntityTypes, listActivity } from "@/lib/admin/forms-queries";
import { formatDateTime } from "@/lib/format";
import { parseListing } from "@/lib/listing";

type SP = Awaited<PageProps<"/admin/activity">["searchParams"]>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);

async function ActivityTable({ searchParams }: { searchParams: PageProps<"/admin/activity">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: ACTIVITY_SORTS, defaultSort: "created", defaultOrder: "desc", defaultPageSize: 50 });
  const entity = one(sp.entity);
  const result = await listActivity(q, entity);

  if (!result.data.length) {
    return q.search || entity ? (
      <EmptyState title="No activity matches these filters" action={{ href: "/admin/activity/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No activity recorded yet" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Actor</TableHead>
              <TableHead className="hidden lg:table-cell">Entity</TableHead>
              <TableHead className="hidden md:table-cell">Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                <TableCell>
                  <span className="font-medium">{a.action}</span>
                  {a.summary && <p className="max-w-56 truncate text-xs text-muted-foreground md:hidden">{a.summary}</p>}
                </TableCell>
                <TableCell className="hidden max-w-48 truncate md:table-cell">{a.actor}</TableCell>
                <TableCell className="hidden whitespace-nowrap lg:table-cell">{a.entityType}{a.entityId ? ` #${a.entityId}` : ""}</TableCell>
                <TableCell className="hidden max-w-80 truncate md:table-cell" title={a.summary}>{a.summary || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} />
    </div>
  );
}

async function Toolbar() {
  const types = await activityEntityTypes();
  return (
    <ListToolbar
      searchPlaceholder="Search action, summary or actor"
      filters={[{ param: "entity", label: "Entities", options: types.map((t) => ({ value: t, label: t })) }]}
      sorts={[{ value: "created", label: "Time" }]}
      defaultSort="created"
      defaultOrder="desc"
    />
  );
}

export default function AdminActivityPage(props: PageProps<"/admin/activity">) {
  return (
    <>
      <AdminPageHeader title="Activity log" description="Sign-ins and every change made in the admin. Read-only." />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} rows={12} />}>
        <ActivityTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
