import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SERVICE_SORTS, listServices } from "@/lib/admin/content-queries";
import { formatDate } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { deleteService } from "./actions";

async function ServicesTable({ searchParams }: { searchParams: PageProps<"/admin/services">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: SERVICE_SORTS, defaultSort: "order", defaultOrder: "asc" });
  const result = await listServices(q, { status: sp.status as string | undefined });
  const filtered = Boolean(q.search || sp.status);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No services match these filters" action={{ href: "/admin/services/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No services yet" action={{ href: "/admin/services/new/", label: "Create service" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Public page</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Order</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((s) => {
              const hasPage = Boolean(s.summary.trim()) || s.highlights.length > 0;
              return (
                <TableRow key={s.id}>
                  <TableCell className="max-w-80">
                    <Link href={`/admin/services/${s.id}/`} className="font-medium hover:text-primary hover:underline">{s.title}</Link>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {hasPage ? `/all-service/${s.slug}/` : "None (title only)"}
                  </TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{s.sortOrder}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(s.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label={`Edit ${s.title}`}>
                        <Link href={`/admin/services/${s.id}/`}><Pencil /></Link>
                      </Button>
                      <ConfirmDelete
                        iconOnly
                        label={`Delete ${s.title}`}
                        action={deleteService.bind(null, s.id)}
                        title={`Delete “${s.title}”?`}
                        description="The service disappears from the home page, footer and its page immediately. This cannot be undone."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} />
    </div>
  );
}

export default function AdminServicesPage(props: PageProps<"/admin/services">) {
  return (
    <>
      <AdminPageHeader
        title="Services"
        description="The four service sheets on the home page, the footer list and /all-service/ pages."
        actions={
          <Button asChild className="h-10">
            <Link href="/admin/services/new/"><Plus aria-hidden /> New service</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search title, slug or summary"
          filters={[{ param: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] }]}
          sorts={[{ value: "order", label: "Order" }, { value: "title", label: "Title" }, { value: "updated", label: "Updated" }]}
          defaultSort="order"
          defaultOrder="asc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={6} rows={6} />}>
        <ServicesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
