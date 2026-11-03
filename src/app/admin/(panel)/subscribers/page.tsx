import { Suspense } from "react";
import { BellOff, CircleCheck, Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SUBSCRIBER_SORTS, listSubscribers } from "@/lib/admin/forms-queries";
import { formatDateTime } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { deleteSubscriber } from "./actions";
import { SubscriberStatusToggle } from "./_components/status-toggle";

type SP = Awaited<PageProps<"/admin/subscribers">["searchParams"]>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);

async function SubscribersTable({ searchParams }: { searchParams: PageProps<"/admin/subscribers">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: SUBSCRIBER_SORTS, defaultSort: "created", defaultOrder: "desc" });
  const status = one(sp.status);
  const result = await listSubscribers(q, status);

  if (!result.data.length) {
    return q.search || status ? (
      <EmptyState title="No subscribers match these filters" action={{ href: "/admin/subscribers/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No subscribers yet" description="Sign-ups from the footer newsletter form appear here." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Signed up on</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="max-w-72 truncate font-medium">{s.email}</TableCell>
                <TableCell>
                  {s.status === "subscribed" ? (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-100"><CircleCheck className="size-3" aria-hidden /> Subscribed</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><BellOff className="size-3" aria-hidden /> Unsubscribed</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{s.sourcePath ?? "—"}</TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{formatDateTime(s.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <SubscriberStatusToggle id={s.id} email={s.email} status={s.status} />
                    <ConfirmDelete
                      iconOnly
                      label={`Delete ${s.email}`}
                      action={deleteSubscriber.bind(null, s.id)}
                      title={`Delete ${s.email}?`}
                      description="The address is removed from the list permanently. To stop mailing someone but keep the record, unsubscribe them instead."
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} />
    </div>
  );
}

async function ExportLink({ searchParams }: { searchParams: PageProps<"/admin/subscribers">["searchParams"] }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ["search", "status", "sort", "order"]) {
    const v = one(sp[k]);
    if (v) qs.set(k, v);
  }
  return (
    <a href={`/admin/subscribers/export/${qs.size ? `?${qs}` : ""}`} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
      <Download className="size-4" aria-hidden /> Export CSV
    </a>
  );
}

export default function AdminSubscribersPage(props: PageProps<"/admin/subscribers">) {
  return (
    <>
      <AdminPageHeader
        title="Subscribers"
        description="Footer newsletter sign-ups for course launch updates."
        actions={<Suspense fallback={null}><ExportLink searchParams={props.searchParams} /></Suspense>}
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search email"
          filters={[{ param: "status", label: "Statuses", options: [{ value: "subscribed", label: "Subscribed" }, { value: "unsubscribed", label: "Unsubscribed" }] }]}
          sorts={[{ value: "created", label: "Joined" }, { value: "email", label: "Email" }]}
          defaultSort="created"
          defaultOrder="desc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
        <SubscribersTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
