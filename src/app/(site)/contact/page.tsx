import { Suspense } from "react";
import type { Metadata } from "next";
import { ContactRows } from "@/components/site/contact-rows";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { PageHeader } from "@/components/site/page-header";
import { Shimmer } from "@/components/site/skeletons";
import { getPage, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { ENQUIRY_SUBJECT_KEYS, type EnquirySubject } from "@/lib/validation/forms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return buildMetadata({
    title: page?.seoTitle || "Contact",
    description: page?.seoDescription || "Get in touch with Talindia in Calicut: trainings, mentoring, corporate training and job placement assistance.",
    path: "/contact/",
  });
}

async function ContactForm({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.subject) ? sp.subject[0] : sp.subject;
  const subject = ENQUIRY_SUBJECT_KEYS.includes(raw as EnquirySubject) ? (raw as EnquirySubject) : "general";
  return <EnquiryForm defaultSubject={subject} />;
}

async function Details() {
  const { contact } = await getSettings();
  return <ContactRows contact={contact} headingId="contact-details" title="Visit, call or write" />;
}

export default function ContactPage(props: PageProps<"/contact">) {
  return (
    <>
      <PageHeader title="Get in touch" intro="Questions about a training, mentoring or hiring Talindia-trained talent? Send a message and the team will reply." />
      <section aria-labelledby="send-title" className="bg-ground pb-8">
        <div className="frame grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h2 id="send-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:col-span-4">Send Message</h2>
          <div className="bg-field p-5 sm:p-8 lg:col-span-8">
            <Suspense fallback={<Shimmer className="h-96 w-full" />}>
              <ContactForm searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </section>
      <Suspense fallback={<Shimmer className="frame h-[600px]" />}>
        <Details />
      </Suspense>
    </>
  );
}
