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
import { AVAILABILITY_LABEL } from "@/lib/course";
import { COURSE_SORTS, listCourses } from "@/lib/admin/queries";
import { parseListing } from "@/lib/listing";
import { formatDate } from "@/lib/format";
import { deleteCourse } from "./actions";

async function CoursesTable({ searchParams }: { searchParams: PageProps<"/admin/courses">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: COURSE_SORTS, defaultSort: "order", defaultOrder: "asc" });
  const result = await listCourses(q, { status: sp.status as string | undefined, availability: sp.availability as string | undefined });
  const filtered = Boolean(q.search || sp.status || sp.availability);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No trainings match these filters" action={{ href: "/admin/courses/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No trainings yet" description="Create the first training to show it on the website." action={{ href: "/admin/courses/new/", label: "Create training" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Enrolment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Order</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-80">
                  <Link href={`/admin/courses/${c.id}/`} className="font-medium hover:text-primary hover:underline">{c.title}</Link>
                  <p className="truncate text-xs text-muted-foreground">/courses/{c.slug}/</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{AVAILABILITY_LABEL[c.availability]}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{c.sortOrder}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(c.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${c.title}`}>
                      <Link href={`/admin/courses/${c.id}/`}><Pencil /></Link>
                    </Button>
                    <ConfirmDelete
                      iconOnly
                      label={`Delete ${c.title}`}
                      action={deleteCourse.bind(null, c.id)}
                      title={`Delete “${c.title}”?`}
                      description="The training page disappears from the website immediately. Enquiries that mention it are kept. This cannot be undone."
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

export default function AdminCoursesPage(props: PageProps<"/admin/courses">) {
  return (
    <>
      <AdminPageHeader
        title="Trainings"
        description="Courses listed on /trainings/ and the home page departures board."
        actions={
          <Button asChild className="h-10">
            <Link href="/admin/courses/new/"><Plus aria-hidden /> New training</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search title, slug or audience"
          filters={[
            { param: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
            { param: "availability", label: "Enrolment", options: [{ value: "coming_soon", label: "Coming soon" }, { value: "open", label: "Enrolling" }, { value: "closed", label: "Closed" }] },
          ]}
          sorts={[{ value: "order", label: "Order" }, { value: "title", label: "Title" }, { value: "updated", label: "Updated" }]}
          defaultSort="order"
          defaultOrder="asc"
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={6} rows={8} />}>
        <CoursesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
