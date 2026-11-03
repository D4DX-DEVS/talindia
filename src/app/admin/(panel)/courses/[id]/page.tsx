import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { Button } from "@/components/ui/button";
import { getCourseForEdit, mediaPreview } from "@/lib/admin/queries";
import { idSchema } from "@/lib/validation/admin";
import { deleteCourse } from "../actions";
import { CourseForm } from "../_components/course-form";

async function EditCourse({ params }: { params: PageProps<"/admin/courses/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const course = await getCourseForEdit(id.data);
  if (!course) notFound();
  const image = await mediaPreview(course.imageId);
  return (
    <>
      <AdminPageHeader
        title={course.title}
        description={`Last updated ${course.updatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`}
        actions={
          <>
            {course.status === "published" && (
              <Button asChild variant="outline" className="h-10">
                <a href={`/courses/${course.slug}/`} target="_blank" rel="noopener"><ExternalLink aria-hidden /> View</a>
              </Button>
            )}
            <ConfirmDelete
              action={deleteCourse.bind(null, course.id)}
              title={`Delete “${course.title}”?`}
              description="The training page disappears from the website immediately. Enquiries that mention it are kept. This cannot be undone."
              redirectTo="/admin/courses/"
            />
          </>
        }
      />
      <CourseForm
        id={course.id}
        image={image}
        defaults={{
          title: course.title,
          slug: course.slug,
          audience: course.audience,
          highlights: course.highlights,
          marketGap: course.marketGap ?? "",
          category: course.category,
          availability: course.availability,
          status: course.status,
          sortOrder: course.sortOrder,
          imageId: course.imageId,
          seoTitle: course.seoTitle ?? "",
          seoDescription: course.seoDescription ?? "",
        }}
      />
    </>
  );
}

export default function EditCoursePage(props: PageProps<"/admin/courses/[id]">) {
  return (
    <>
      <Link href="/admin/courses/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All trainings
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EditCourse params={props.params} />
      </Suspense>
    </>
  );
}
