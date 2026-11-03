import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { WhyOffer } from "@/components/home/why-offer";
import { ButtonLink } from "@/components/site/button-link";
import { PageHeader } from "@/components/site/page-header";
import { ArticleSkeleton } from "@/components/site/skeletons";
import { getFeatures, getPage, getSettings, mediaUrl } from "@/lib/data/public";
import { renderMarkdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about-us");
  return buildMetadata({ title: page?.seoTitle || page?.title || "About Us", description: page?.seoDescription || page?.intro, path: "/about-us/" });
}

async function AboutContent() {
  const [page, why, offerings, settings] = await Promise.all([getPage("about-us"), getFeatures("why_choose"), getFeatures("offerings"), getSettings()]);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <section aria-labelledby="story-title" className="bg-ground pb-20 sm:pb-28">
        <div className="frame grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <h2 id="story-title" className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">About Talindia</h2>
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
            <ButtonLink href="/contact/" size="lg" className="mt-4">Connect With Us</ButtonLink>
          </div>
          {page.image && (
            <div className="relative aspect-square overflow-hidden rounded-full bg-paper lg:col-span-5 lg:col-start-8">
              <Image src={mediaUrl(page.image.key)} alt={page.image.alt || "Recruiter reviewing candidate profiles on a large screen"} fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-contain p-[9%]" />
            </div>
          )}
        </div>
      </section>
      <div className="bg-field">
        <WhyOffer whyHeading={settings.sections.whyHeading} offeringsHeading={settings.sections.offeringsHeading} why={why} offerings={offerings} />
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <AboutContent />
    </Suspense>
  );
}
