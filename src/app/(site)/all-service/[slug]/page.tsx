import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/site/button-link";
import { PageHeader } from "@/components/site/page-header";
import { ArticleSkeleton } from "@/components/site/skeletons";
import { getService, mediaUrl } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/all-service/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const service = await getService(slug);
  if (!service) return buildMetadata({ title: "Service not found", path: `/all-service/${slug}/`, noindex: true });
  return buildMetadata({
    title: service.seoTitle || service.title,
    description: service.seoDescription || [service.summary, ...service.highlights].filter(Boolean).join(". "),
    path: `/all-service/${service.slug}/`,
    imageKey: service.image?.key,
  });
}

async function ServiceDetail({ params }: { params: PageProps<"/all-service/[slug]">["params"] }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  return (
    <>
      <PageHeader title={service.title} intro={service.summary} crumbs={[]} />
      <section aria-labelledby="service-includes" className="bg-ground pb-24 sm:pb-32">
        <div className="frame grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <h2 id="service-includes" className="text-3xl font-extrabold tracking-tight sm:text-4xl">What it includes</h2>
            <ul className="mt-8 space-y-3">
              {service.highlights.map((h) => (
                <li key={h} className="flex gap-4 bg-paper p-5 text-lg text-ink">
                  <Check className="mt-0.5 size-6 shrink-0 text-violet" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
            <ButtonLink href="/contact/" size="lg" className="mt-10">Talk to us</ButtonLink>
          </div>
          {service.image && (
            <div className="relative aspect-square bg-indigo lg:col-span-5 lg:col-start-8">
              <Image src={mediaUrl(service.image.key)} alt={service.image.alt || ""} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-contain object-bottom pt-10" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function ServicePage(props: PageProps<"/all-service/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <ServiceDetail params={props.params} />
    </Suspense>
  );
}
