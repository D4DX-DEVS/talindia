import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FeatureForm } from "../_components/feature-form";

export default function NewHighlightPage() {
  return (
    <>
      <Link href="/admin/highlights/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All highlights
      </Link>
      <AdminPageHeader title="New highlight" />
      <FeatureForm id={null} defaults={{ group: "offerings", title: "", description: "", icon: "sparkles", status: "draft", sortOrder: 100 }} />
    </>
  );
}
