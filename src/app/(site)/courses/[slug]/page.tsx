import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Plane } from "lucide-react";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { ArticleSkeleton } from "@/components/site/skeletons";
import { AVAILABILITY_LABEL } from "@/lib/course";
import { getCourse, getSettings, mediaUrl } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const course = await getCourse(slug);
  if (!course) return buildMetadata({ title: "Training not found", path: `/courses/${slug}/`, noindex: true });
  return buildMetadata({
    title: course.seoTitle || course.title,
    description: course.seoDescription || `${course.title}: ${course.audience}.`,
    path: `/courses/${course.slug}/`,
    imageKey: course.image?.key,
  });
}

async function CourseDetail({ params }: { params: PageProps<"/courses/[slug]">["params"] }) {
  const { slug } = await params;
  const [course, { site }] = await Promise.all([getCourse(slug), getSettings()]);
  if (!course) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: [course.audience, ...course.highlights].join(". "),
    url: absoluteUrl(`/courses/${course.slug}/`),
    provider: { "@type": "EducationalOrganization", name: site.name, url: absoluteUrl("/") },
    ...(course.image ? { image: absoluteUrl(mediaUrl(course.image.key)) } : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader title={course.title} intro={course.audience} crumbs={[{ href: "/trainings/", label: "Trainings" }]}>
        <p className="mt-6 inline-flex items-center gap-2 bg-ink px-3 py-1.5 text-base font-bold text-white">
          <Plane className="size-4" aria-hidden /> {AVAILABILITY_LABEL[course.availability]}
        </p>
      </PageHeader>
      <section aria-labelledby="covers-title" className="bg-ground pb-20 sm:pb-28">
        <div className="frame grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <h2 id="covers-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">What the training covers</h2>
            {course.highlights.length ? (
              <ul className="mt-8 space-y-4">
                {course.highlights.map((h) => (
                  <li key={h} className="flex gap-4 bg-paper p-5 text-lg text-ink">
                    <Check className="mt-0.5 size-6 shrink-0 text-violet" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-lg text-ink">The full syllabus will be published when enrolment opens. Register your interest below and the team will share details first.</p>
            )}
            {course.marketGap && (
              <div className="mt-8 bg-indigo p-6 text-white sm:p-8">
                <h3 className="text-xl font-bold">Why now</h3>
                <p className="mt-2 text-lg text-on-dark">{course.marketGap}</p>
              </div>
            )}
          </div>
          {course.image && (
            <div className="relative aspect-[3/2] overflow-hidden bg-field lg:col-span-6">
              <Image src={mediaUrl(course.image.key)} alt={course.image.alt || ""} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>
      <section id="enquire" aria-labelledby="enquire-title" className="scroll-mt-20 bg-night py-20 text-on-dark sm:py-28">
        <div className="frame grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h2 id="enquire-title" className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Register your interest</h2>
            <p className="mt-4 text-lg text-on-dark">Tell us a little about yourself and we will contact you about dates, fees and eligibility.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <EnquiryForm courseSlug={course.slug} courseTitle={course.title} tone="dark" />
          </div>
        </div>
      </section>
    </>
  );
}

export default function CoursePage(props: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <CourseDetail params={props.params} />
    </Suspense>
  );
}
