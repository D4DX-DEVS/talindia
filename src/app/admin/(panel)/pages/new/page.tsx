import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PageForm } from "../_components/page-form";

export default function NewPagePage() {
  return (
    <>
      <Link href="/admin/pages/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All pages
      </Link>
      <AdminPageHeader title="New page" />
      <PageForm
        id={null}
        image={null}
        system={false}
        defaults={{ title: "", slug: "", intro: "", body: "", status: "draft", imageId: null, seoTitle: "", seoDescription: "" }}
      />
    </>
  );
}
