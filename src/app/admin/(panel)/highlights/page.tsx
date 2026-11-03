import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { CmsIcon } from "@/components/site/icon";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FEATURE_SORTS, listFeatures } from "@/lib/admin/content-queries";
import { formatDate } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { deleteFeature } from "./actions";

const GROUP_LABEL = { why_choose: "Why choose Talindia", offerings: "We offer services" } as const;

async function FeaturesTable({ searchParams }: { searchParams: PageProps<"/admin/highlights">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: FEATURE_SORTS, defaultSort: "order", defaultOrder: "asc" });
  const result = await listFeatures(q, { status: sp.status as string | undefined, group: sp.group as string | undefined });
  const filtered = Boolean(q.search || sp.status || sp.group);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No highlights match these filters" action={{ href: "/admin/highlights/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No highlights yet" action={{ href: "/admin/highlights/new/", label: "Create highlight" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Order</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-80">
                  <Link href={`/admin/highlights/${f.id}/`} className="inline-flex items-center gap-2 font-medium hover:text-primary hover:underline">
                    <CmsIcon name={f.icon} className="size-4 text-muted-foreground" /> {f.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{GROUP_LABEL[f.group]}</TableCell>
                <TableCell><StatusBadge status={f.status} /></TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{f.sortOrder}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(f.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${f.title}`}>
                      <Link href={`/admin/highlights/${f.id}/`}><Pencil /></Link>
                    </Button>
                    <ConfirmDelete
                      iconOnly
                      label={`Delete ${f.title}`}
                      action={deleteFeature.bind(null, f.id)}
                      title={`Delete “${f.title}”?`}
                      description="It disappears from the home and About pages immediately. This cannot be undone."
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

export default function AdminHighlightsPage(props: PageProps<"/admin/highlights">) {
  return (
    <>
      <AdminPageHeader
        title="Highlights"
        description="“Why choose Talindia” reasons and “We offer services” items on the home and About pages."
        actions={
          <Button asChild className="h-10">
            <Link href="/admin/highlights/new/"><Plus aria-hidden /> New highlight</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search title or description"
          filters={[
            { param: "group", label: "Sections", options: [{ value: "why_choose", label: GROUP_LABEL.why_choose }, { value: "offerings", label: GROUP_LABEL.offerings }] },
            { param: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
          ]}
          sorts={[{ value: "order", label: "Order" }, { value: "title", label: "Title" }, { value: "updated", label: "Updated" }]}
          defaultSort="order"
          defaultOrder="asc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={6} rows={9} />}>
        <FeaturesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
