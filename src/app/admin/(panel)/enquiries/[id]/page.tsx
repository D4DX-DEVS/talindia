import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { Button } from "@/components/ui/button";
import { getEnquiry } from "@/lib/admin/forms-queries";
import { formatDateTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/admin";
import { deleteEnquiry } from "../actions";
import { EnquiryUpdateForm } from "../_components/enquiry-form";
import { EnquiryStatusBadge } from "../_components/enquiry-status";

function websiteHref(raw: string): string | null {
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

async function EnquiryDetail({ params }: { params: PageProps<"/admin/enquiries/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = idSchema.safeParse(raw);
  if (!id.success) notFound();
  const row = await getEnquiry(id.data);
  if (!row) notFound();
  const e = row.enquiry;
  const site = e.website ? websiteHref(e.website) : null;
  const replySubject = encodeURIComponent(`Re: ${e.subject ?? "Your enquiry to Talindia"}`);

  return (
    <>
      <AdminPageHeader
        title={e.name}
        description={`Received ${formatDateTime(e.createdAt)} (IST)`}
        actions={
          <>
            <Button asChild variant="outline" className="h-10">
              <a href={`mailto:${e.email}?subject=${replySubject}`}><Mail aria-hidden /> Reply</a>
            </Button>
            <ConfirmDelete
              action={deleteEnquiry.bind(null, e.id)}
              title={`Delete the enquiry from ${e.name}?`}
              description="The message and your notes are removed permanently. This cannot be undone."
              redirectTo="/admin/enquiries/"
            />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-4 sm:p-6 xl:col-span-2" aria-labelledby="msg-title">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="msg-title" className="font-semibold">{e.subject ?? "Enquiry"}</h2>
            <EnquiryStatusBadge status={e.status} />
          </div>
          <dl className="divide-y">
            <Row label="Email"><a href={`mailto:${e.email}`} className="text-primary hover:underline">{e.email}</a></Row>
            {e.phone && (
              <Row label="Phone">
                <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Phone className="size-3.5" aria-hidden /> {e.phone}
                </a>
              </Row>
            )}
            {e.website && (
              <Row label="Website">
                {site ? (
                  <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    {e.website} <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : e.website}
              </Row>
            )}
            {e.courseId && row.courseTitle && (
              <Row label="Training">
                <Link href={`/admin/courses/${e.courseId}/`} className="text-primary hover:underline">{row.courseTitle}</Link>
              </Row>
            )}
            <Row label="Sent from">{e.sourcePath ?? "—"}</Row>
            <Row label="Message"><p className="whitespace-pre-wrap">{e.message}</p></Row>
          </dl>
        </section>
        <EnquiryUpdateForm id={e.id} defaults={{ status: e.status, notes: e.notes ?? "" }} />
      </div>
    </>
  );
}

export default function EnquiryPage(props: PageProps<"/admin/enquiries/[id]">) {
  return (
    <>
      <Link href="/admin/enquiries/" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All enquiries
      </Link>
      <Suspense fallback={<FormSkeleton />}>
        <EnquiryDetail params={props.params} />
      </Suspense>
    </>
  );
}
