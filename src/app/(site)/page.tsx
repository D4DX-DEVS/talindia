import { Suspense } from "react";
import type { Metadata } from "next";
import { AboutPanel } from "@/components/home/about-panel";
import { CtaTiles } from "@/components/home/cta-tiles";
import { Hero } from "@/components/home/hero";
import { Testimonials } from "@/components/home/testimonials";
import { TrainingsList } from "@/components/home/trainings-list";
import { JsonLd } from "@/components/site/json-ld";
import { HomeSkeleton } from "@/components/site/skeletons";
import { getCourses, getMediaByKey, getPage, getServices, getSettings, getTestimonials } from "@/lib/data/public";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("home");
  return buildMetadata({ title: null, description: page?.seoDescription, path: "/" });
}

async function HomeContent() {
  const [settings, services, courses, testimonials, org] = await Promise.all([
    getSettings(),
    getServices(),
    getCourses({ search: "", page: 1, pageSize: 6 }),
    getTestimonials(),
    organizationJsonLd(),
  ]);
  const [portrait, illustration] = await Promise.all([
    getMediaByKey(settings.hero.imageKey),
    getMediaByKey(settings.homeAbout.imageKey),
  ]);
  return (
    <>
      <JsonLd data={org} />
      <Hero hero={settings.hero} portrait={portrait} />
      <AboutPanel about={settings.homeAbout} services={services} illustration={illustration} />
      <TrainingsList heading={settings.sections.coursesHeading} courses={courses.data} />
      <Testimonials heading={settings.sections.testimonialsHeading} items={testimonials} />
      <CtaTiles webinar={settings.webinar} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
