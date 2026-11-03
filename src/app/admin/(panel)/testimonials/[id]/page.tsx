import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { getTestimonialForEdit } from "@/lib/admin/content-queries";
import { formatDateTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/admin";
import { deleteTestimonial } from "../actions";
import { TestimonialForm } from "../_components/testimonial-form";

async function EditTestimonial({ params }: { params: PageProps<"/admin/testimonials/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const t = await getTestimonialForEdit(id.data);
  if (!t) notFound();
  return (
    <>
      <AdminPageHeader
        title={`Testimonial from ${t.name}`}
        description={`Last updated ${formatDateTime(t.updatedAt)}`}
        actions={
          <ConfirmDelete
            action={deleteTestimonial.bind(null, t.id)}
            title={`Delete the testimonial from ${t.name}?`}
            description="It disappears from the home page immediately. This cannot be undone."
            redirectTo="/admin/testimonials/"
          />
        }
      />
      <TestimonialForm id={t.id} defaults={{ quote: t.quote, name: t.name, role: t.role, status: t.status, sortOrder: t.sortOrder }} />
    </>
  );
}

export default function EditTestimonialPage(props: PageProps<"/admin/testimonials/[id]">) {
  return (
    <>
      <Link href="/admin/testimonials/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All testimonials
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EditTestimonial params={props.params} />
      </Suspense>
    </>
  );
}
