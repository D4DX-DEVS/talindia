import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CourseForm } from "../_components/course-form";

export default function NewCoursePage() {
  return (
    <>
      <Link href="/admin/courses/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All trainings
      </Link>
      <AdminPageHeader title="New training" />
      <CourseForm
        id={null}
        image={null}
        defaults={{
          title: "",
          slug: "",
          audience: "",
          highlights: [],
          marketGap: "",
          category: "",
          availability: "coming_soon",
          status: "draft",
          sortOrder: 100,
          imageId: null,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
