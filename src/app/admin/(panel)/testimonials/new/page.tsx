import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TestimonialForm } from "../_components/testimonial-form";

export default function NewTestimonialPage() {
  return (
    <>
      <Link href="/admin/testimonials/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All testimonials
      </Link>
      <AdminPageHeader title="New testimonial" />
      <TestimonialForm id={null} defaults={{ quote: "", name: "", role: "", status: "draft", sortOrder: 100 }} />
    </>
  );
}
