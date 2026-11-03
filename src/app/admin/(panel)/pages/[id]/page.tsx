import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { Button } from "@/components/ui/button";
import { getPageForEdit, pagePath } from "@/lib/admin/content-queries";
import { mediaPreview } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/admin";
import { deletePage } from "../actions";
import { PageForm } from "../_components/page-form";

async function EditPage({ params }: { params: PageProps<"/admin/pages/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const p = await getPageForEdit(id.data);
  if (!p) notFound();
  const image = await mediaPreview(p.imageId);
  return (
    <>
      <AdminPageHeader
        title={p.title}
        description={`Last updated ${formatDateTime(p.updatedAt)}`}
        actions={
          <>
            {p.status === "published" && (
              <Button asChild variant="outline" className="h-10">
                <a href={pagePath(p.slug)} target="_blank" rel="noopener"><ExternalLink aria-hidden /> View</a>
              </Button>
            )}
            {!p.system && (
              <ConfirmDelete
                action={deletePage.bind(null, p.id)}
                title={`Delete “${p.title}”?`}
                description={`${pagePath(p.slug)} stops working immediately. This cannot be undone.`}
                redirectTo="/admin/pages/"
              />
            )}
          </>
        }
      />
      <PageForm
        id={p.id}
        image={image}
        system={p.system}
        defaults={{
          title: p.title,
          slug: p.slug,
          intro: p.intro,
          body: p.body,
          status: p.status,
          imageId: p.imageId,
          seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
        }}
      />
    </>
  );
}

export default function EditPagePage(props: PageProps<"/admin/pages/[id]">) {
  return (
    <>
      <Link href="/admin/pages/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All pages
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EditPage params={props.params} />
      </Suspense>
    </>
  );
}
