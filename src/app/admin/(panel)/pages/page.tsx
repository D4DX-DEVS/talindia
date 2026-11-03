import { Suspense } from "react";
import Link from "next/link";
import { Lock, Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_SORTS, listPages, pagePath } from "@/lib/admin/content-queries";
import { formatDate } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { deletePage } from "./actions";

async function PagesTable({ searchParams }: { searchParams: PageProps<"/admin/pages">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: PAGE_SORTS, defaultSort: "title", defaultOrder: "asc" });
  const result = await listPages(q, { status: sp.status as string | undefined, kind: sp.kind as string | undefined });
  const filtered = Boolean(q.search || sp.status || sp.kind);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No pages match these filters" action={{ href: "/admin/pages/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No pages yet" action={{ href: "/admin/pages/new/", label: "Create page" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/pages/${p.id}/`} className="font-medium hover:text-primary hover:underline">{p.title}</Link>
                  {p.system && (
                    <Badge variant="outline" className="ml-2 gap-1"><Lock className="size-3" aria-hidden /> System</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{pagePath(p.slug)}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(p.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.title}`}>
                      <Link href={`/admin/pages/${p.id}/`}><Pencil /></Link>
                    </Button>
                    {!p.system && (
                      <ConfirmDelete
                        iconOnly
                        label={`Delete ${p.title}`}
                        action={deletePage.bind(null, p.id)}
                        title={`Delete “${p.title}”?`}
                        description={`${pagePath(p.slug)} stops working immediately. This cannot be undone.`}
                      />
                    )}
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

export default function AdminPagesPage(props: PageProps<"/admin/pages">) {
  return (
    <>
      <AdminPageHeader
        title="Pages"
        description="System pages hold text and SEO for the fixed routes; custom pages (e.g. a privacy policy) get their own address."
        actions={
          <Button asChild className="h-10">
            <Link href="/admin/pages/new/"><Plus aria-hidden /> New page</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search title, slug or intro"
          filters={[
            { param: "kind", label: "Types", options: [{ value: "system", label: "System" }, { value: "custom", label: "Custom" }] },
            { param: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
          ]}
          sorts={[{ value: "title", label: "Title" }, { value: "slug", label: "Address" }, { value: "updated", label: "Updated" }]}
          defaultSort="title"
          defaultOrder="asc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} rows={4} />}>
        <PagesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
