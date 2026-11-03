import { Suspense } from "react";
import Link from "next/link";
import { Info, Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TESTIMONIAL_SORTS, listTestimonials } from "@/lib/admin/content-queries";
import { formatDate } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { deleteTestimonial } from "./actions";

async function TestimonialsTable({ searchParams }: { searchParams: PageProps<"/admin/testimonials">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: TESTIMONIAL_SORTS, defaultSort: "order", defaultOrder: "asc" });
  const result = await listTestimonials(q, { status: sp.status as string | undefined });
  const filtered = Boolean(q.search || sp.status);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No testimonials match these filters" action={{ href: "/admin/testimonials/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No testimonials yet" action={{ href: "/admin/testimonials/new/", label: "Add testimonial" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Order</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/admin/testimonials/${t.id}/`} className="font-medium hover:text-primary hover:underline">{t.name}</Link>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </TableCell>
                <TableCell className="hidden max-w-md truncate text-sm text-muted-foreground md:table-cell">{t.quote}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{t.sortOrder}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(t.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit testimonial from ${t.name}`}>
                      <Link href={`/admin/testimonials/${t.id}/`}><Pencil /></Link>
                    </Button>
                    <ConfirmDelete
                      iconOnly
                      label={`Delete testimonial from ${t.name}`}
                      action={deleteTestimonial.bind(null, t.id)}
                      title={`Delete the testimonial from ${t.name}?`}
                      description="It disappears from the home page immediately. This cannot be undone."
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

export default function AdminTestimonialsPage(props: PageProps<"/admin/testimonials">) {
  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="“Success stories” on the home page. The first published one is shown largest."
        actions={
          <Button asChild className="h-10">
            <Link href="/admin/testimonials/new/"><Plus aria-hidden /> New testimonial</Link>
          </Button>
        }
      />
      <p role="note" className="mb-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        These testimonials were migrated from the old website. Please confirm each one with the person quoted before keeping it published.
      </p>
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search name, role or quote"
          filters={[{ param: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] }]}
          sorts={[{ value: "order", label: "Order" }, { value: "name", label: "Name" }, { value: "updated", label: "Updated" }]}
          defaultSort="order"
          defaultOrder="asc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={6} rows={3} />}>
        <TestimonialsTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
