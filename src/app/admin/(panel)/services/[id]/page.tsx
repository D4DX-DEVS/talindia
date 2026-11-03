import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { Button } from "@/components/ui/button";
import { getServiceForEdit } from "@/lib/admin/content-queries";
import { mediaPreview } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/admin";
import { deleteService } from "../actions";
import { ServiceForm } from "../_components/service-form";

async function EditService({ params }: { params: PageProps<"/admin/services/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const s = await getServiceForEdit(id.data);
  if (!s) notFound();
  const image = await mediaPreview(s.imageId);
  const hasPage = Boolean(s.summary.trim()) || s.highlights.length > 0;
  return (
    <>
      <AdminPageHeader
        title={s.title}
        description={`Last updated ${formatDateTime(s.updatedAt)}`}
        actions={
          <>
            {s.status === "published" && hasPage && (
              <Button asChild variant="outline" className="h-10">
                <a href={`/all-service/${s.slug}/`} target="_blank" rel="noopener"><ExternalLink aria-hidden /> View</a>
              </Button>
            )}
            <ConfirmDelete
              action={deleteService.bind(null, s.id)}
              title={`Delete “${s.title}”?`}
              description="The service disappears from the website immediately. This cannot be undone."
              redirectTo="/admin/services/"
            />
          </>
        }
      />
      <ServiceForm
        id={s.id}
        image={image}
        defaults={{
          title: s.title,
          slug: s.slug,
          summary: s.summary,
          highlights: s.highlights,
          icon: s.icon,
          status: s.status,
          sortOrder: s.sortOrder,
          imageId: s.imageId,
          seoTitle: s.seoTitle ?? "",
          seoDescription: s.seoDescription ?? "",
        }}
      />
    </>
  );
}

export default function EditServicePage(props: PageProps<"/admin/services/[id]">) {
  return (
    <>
      <Link href="/admin/services/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All services
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EditService params={props.params} />
      </Suspense>
    </>
  );
}
