import { Suspense } from "react";
import Link from "next/link";
import { FileText, TriangleAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { listMedia, MEDIA_SORTS, MEDIA_TYPES } from "@/lib/admin/media-queries";
import { formatBytes } from "@/lib/format";
import { parseListing, pickEnum } from "@/lib/listing";
import { mediaUrl } from "@/lib/media-url";
import { Uploader } from "./_components/uploader";

async function MediaGrid({ searchParams }: { searchParams: PageProps<"/admin/media">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: MEDIA_SORTS, defaultSort: "created", defaultOrder: "desc", defaultPageSize: 20 });
  const type = pickEnum(sp.type, MEDIA_TYPES);
  const result = await listMedia(q, type);

  if (!result.data.length) {
    return q.search || type ? (
      <EmptyState title="No files match these filters" action={{ href: "/admin/media/", label: "Clear filters" }} />
    ) : (
      <EmptyState title="The media library is empty" description="Upload images or PDFs above." />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {result.data.map((m) => {
          const isImage = m.mimeType.startsWith("image/");
          const src = m.mimeType === "image/svg+xml" ? mediaUrl(m.key) : `${mediaUrl(m.key)}?w=320&q=70`;
          return (
            <li key={m.id}>
              <Link href={`/admin/media/${m.id}/`} className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:ring-2 hover:ring-primary">
                <div className="flex aspect-square items-center justify-center bg-muted p-2">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail via the media route
                    <img src={src} alt={m.alt || ""} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <FileText className="size-10 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p className="truncate text-sm font-medium" title={m.filename}>{m.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(m.size)}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                  </p>
                  {isImage && !m.alt && (
                    <p className="mt-auto flex items-center gap-1 text-xs font-medium text-amber-700">
                      <TriangleAlert className="size-3" aria-hidden /> Missing alt text
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading media" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}

export default function MediaLibraryPage(props: PageProps<"/admin/media">) {
  return (
    <>
      <AdminPageHeader title="Media library" description="Files stored in Cloudflare R2, including everything migrated from WordPress." />
      <Uploader />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <ListToolbar
          searchPlaceholder="Search file name, alt text or path"
          filters={[{ param: "type", label: "Types", options: [{ value: "images", label: "Images" }, { value: "svg", label: "SVG" }, { value: "other", label: "Documents & other" }] }]}
          sorts={[{ value: "created", label: "Uploaded" }, { value: "name", label: "Name" }, { value: "size", label: "Size" }]}
          defaultSort="created"
          defaultOrder="desc"
        />
      </Suspense>
      <Suspense fallback={<GridSkeleton />}>
        <MediaGrid searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
