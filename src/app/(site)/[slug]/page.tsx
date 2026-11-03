import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { ArticleSkeleton } from "@/components/site/skeletons";
import { getPage } from "@/lib/data/public";
import { renderMarkdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";

/** Pages created in the CMS (e.g. a privacy policy). System pages have their own routes. */
const SYSTEM = new Set(["home", "about-us", "contact", "trainings"]);

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = SYSTEM.has(slug) ? null : await getPage(slug);
  if (!page) return buildMetadata({ title: "Page not found", path: `/${slug}/`, noindex: true });
  return buildMetadata({ title: page.seoTitle || page.title, description: page.seoDescription || page.intro, path: `/${page.slug}/`, imageKey: page.image?.key });
}

async function CmsPage({ params }: { params: PageProps<"/[slug]">["params"] }) {
  const { slug } = await params;
  const page = SYSTEM.has(slug) ? null : await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <section className="bg-ground pb-24 sm:pb-32" aria-label={page.title}>
        <div className="frame">
          <div className="prose-site max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
          <p className="mt-10 text-sm text-soft">Last updated {page.updatedAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <CmsPage params={props.params} />
    </Suspense>
  );
}
