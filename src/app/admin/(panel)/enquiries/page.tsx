import { Suspense } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENQUIRY_SORTS, courseOptions, listEnquiries } from "@/lib/admin/forms-queries";
import { formatDateTime } from "@/lib/format";
import { parseListing } from "@/lib/listing";
import { ENQUIRY_STATUS_OPTIONS, EnquiryStatusBadge } from "./_components/enquiry-status";

type SP = Awaited<PageProps<"/admin/enquiries">["searchParams"]>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);

async function EnquiriesTable({ searchParams }: { searchParams: PageProps<"/admin/enquiries">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: ENQUIRY_SORTS, defaultSort: "created", defaultOrder: "desc" });
  const filters = { status: one(sp.status), course: one(sp.course) };
  const result = await listEnquiries(q, filters);
  const filtered = Boolean(q.search || filters.status || filters.course);

  if (!result.data.length) {
    return filtered ? (
      <EmptyState title="No enquiries match these filters" action={{ href: "/admin/enquiries/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="No enquiries yet" description="Messages sent from the contact and training forms appear here." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead className="hidden md:table-cell">Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Training</TableHead>
              <TableHead className="hidden md:table-cell">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="max-w-64">
                  <Link href={`/admin/enquiries/${e.id}/`} className="font-medium hover:text-primary hover:underline">{e.name}</Link>
                  <p className="truncate text-xs text-muted-foreground">{e.email}</p>
                  <p className="text-xs text-muted-foreground md:hidden">{formatDateTime(e.createdAt)}</p>
                </TableCell>
                <TableCell className="hidden max-w-72 truncate md:table-cell">{e.subject ?? "—"}</TableCell>
                <TableCell><EnquiryStatusBadge status={e.status} /></TableCell>
                <TableCell className="hidden max-w-56 truncate lg:table-cell">
                  {e.courseId && e.courseTitle ? (
                    <Link href={`/admin/courses/${e.courseId}/`} className="hover:underline">{e.courseTitle}</Link>
                  ) : "—"}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{formatDateTime(e.createdAt)}</TableCell>
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
  const courses = await courseOptions();
  return (
    <ListToolbar
      searchPlaceholder="Search name, email, subject or message"
      filters={[
        { param: "status", label: "Statuses", options: ENQUIRY_STATUS_OPTIONS },
        ...(courses.length ? [{ param: "course", label: "Trainings", options: courses }] : []),
      ]}
      sorts={[{ value: "created", label: "Received" }, { value: "name", label: "Name" }, { value: "status", label: "Status" }]}
      defaultSort="created"
      defaultOrder="desc"
    />
  );
}

async function ExportLink({ searchParams }: { searchParams: PageProps<"/admin/enquiries">["searchParams"] }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ["search", "status", "course", "sort", "order"]) {
    const v = one(sp[k]);
    if (v) qs.set(k, v);
  }
  return (
    <a href={`/admin/enquiries/export/${qs.size ? `?${qs}` : ""}`} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">
      <Download className="size-4" aria-hidden /> Export CSV
    </a>
  );
}

export default function AdminEnquiriesPage(props: PageProps<"/admin/enquiries">) {
  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description="Contact form and training interest submissions."
        actions={
          <Suspense fallback={null}>
            <ExportLink searchParams={props.searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
        <EnquiriesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
