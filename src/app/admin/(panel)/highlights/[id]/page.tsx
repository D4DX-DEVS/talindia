import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { getFeatureForEdit } from "@/lib/admin/content-queries";
import { formatDateTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/admin";
import { deleteFeature } from "../actions";
import { FeatureForm } from "../_components/feature-form";

async function EditFeature({ params }: { params: PageProps<"/admin/highlights/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const f = await getFeatureForEdit(id.data);
  if (!f) notFound();
  return (
    <>
      <AdminPageHeader
        title={f.title}
        description={`Last updated ${formatDateTime(f.updatedAt)}`}
        actions={
          <ConfirmDelete
            action={deleteFeature.bind(null, f.id)}
            title={`Delete “${f.title}”?`}
            description="It disappears from the website immediately. This cannot be undone."
            redirectTo="/admin/highlights/"
          />
        }
      />
      <FeatureForm id={f.id} defaults={{ group: f.group, title: f.title, description: f.description, icon: f.icon, status: f.status, sortOrder: f.sortOrder }} />
    </>
  );
}

export default function EditHighlightPage(props: PageProps<"/admin/highlights/[id]">) {
  return (
    <>
      <Link href="/admin/highlights/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All highlights
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EditFeature params={props.params} />
      </Suspense>
    </>
  );
}
