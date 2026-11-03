import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { Button } from "@/components/ui/button";
import { getMediaDetail, mediaUsage } from "@/lib/admin/media-queries";
import { formatBytes, formatDateTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media-url";
import { siteUrl } from "@/lib/site-url";
import { idSchema } from "@/lib/validation/admin";
import { deleteMedia } from "../actions";
import { CopyButton, MediaEditForm } from "../_components/media-edit-form";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-all">{children}</dd>
    </div>
  );
}

async function MediaDetail({ params }: { params: PageProps<"/admin/media/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const item = await getMediaDetail(id.data);
  if (!item) notFound();
  const usage = await mediaUsage(item.id, item.key);
  const url = mediaUrl(item.key);
  const publicUrl = `${siteUrl()}${url}`;
  const isImage = item.mimeType.startsWith("image/");

  return (
    <>
      <AdminPageHeader
        title={item.filename}
        description={item.mimeType}
        actions={
          <>
            <Button asChild variant="outline" className="h-10">
              <a href={url} target="_blank" rel="noopener"><ExternalLink aria-hidden /> Open file</a>
            </Button>
            <ConfirmDelete
              action={deleteMedia.bind(null, item.id)}
              title={`Delete ${item.filename}?`}
              description={
                usage.length
                  ? `This file is still used (${usage.map((u) => u.label).join("; ")}). Deleting will be refused until it is replaced there.`
                  : "The file is removed from storage and any old links to it stop working. This cannot be undone."
              }
              redirectTo="/admin/media/"
            />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="flex min-h-64 items-center justify-center rounded-xl border bg-muted p-4 xl:col-span-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview via the media route
            <img src={item.mimeType === "image/svg+xml" ? url : `${url}?w=1200&q=80`} alt={item.alt || ""} className="max-h-[70svh] max-w-full object-contain" />
          ) : (
            <FileText className="size-16 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="details-title">
            <h2 id="details-title" className="mb-2 font-semibold">Details</h2>
            <dl className="divide-y">
              <Row label="Public URL">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 font-mono text-xs">{publicUrl}</span>
                  <CopyButton value={publicUrl} label="Copy public URL" />
                </span>
              </Row>
              <Row label="Storage key"><span className="font-mono text-xs">{item.key}</span></Row>
              {item.legacyUrl && <Row label="WordPress URL"><span className="font-mono text-xs">{item.legacyUrl}</span></Row>}
              <Row label="Size">{formatBytes(item.size)}</Row>
              <Row label="Dimensions">{item.width && item.height ? `${item.width} × ${item.height}px` : "—"}</Row>
              <Row label="Type">{item.mimeType}</Row>
              <Row label="Uploaded">{`${formatDateTime(item.createdAt)}${item.uploadedBy ? ` by ${item.uploadedBy}` : ""}`}</Row>
            </dl>
          </section>
          <section className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="edit-title">
            <h2 id="edit-title" className="mb-4 font-semibold">Accessibility & search</h2>
            <MediaEditForm id={item.id} defaults={{ alt: item.alt, title: item.title }} />
          </section>
          <section className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="usage-title">
            <h2 id="usage-title" className="mb-2 font-semibold">Where it is used</h2>
            {usage.length ? (
              <ul className="divide-y">
                {usage.map((u) => (
                  <li key={`${u.kind}-${u.href}`}>
                    <Link href={u.href} className="flex min-h-10 items-center text-sm text-primary hover:underline">{u.label}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not used by any training, service, page or setting.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default function MediaDetailPage(props: PageProps<"/admin/media/[id]">) {
  return (
    <>
      <Link href="/admin/media/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Media library
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <MediaDetail params={props.params} />
      </Suspense>
    </>
  );
}
