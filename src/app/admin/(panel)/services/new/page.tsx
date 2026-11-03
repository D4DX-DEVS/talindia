import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "../_components/service-form";

export default function NewServicePage() {
  return (
    <>
      <Link href="/admin/services/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All services
      </Link>
      <AdminPageHeader title="New service" />
      <ServiceForm
        id={null}
        image={null}
        defaults={{ title: "", slug: "", summary: "", highlights: [], icon: "sparkles", status: "draft", sortOrder: 100, imageId: null, seoTitle: "", seoDescription: "" }}
      />
    </>
  );
}
