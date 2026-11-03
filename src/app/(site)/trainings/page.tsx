import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { PageHeader } from "@/components/site/page-header";
import { CourseListSkeleton } from "@/components/site/skeletons";
import { AVAILABILITY_LABEL } from "@/lib/course";
import { COURSE_AVAILABILITY } from "@/db/schema";
import { getCourses, getPage, mediaUrl } from "@/lib/data/public";
import { parseListing, pickEnum } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";
import { TrainingsToolbar } from "./_components/trainings-toolbar";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("trainings");
  return buildMetadata({
    title: page?.seoTitle || "Trainings",
    description: page?.seoDescription || "Upcoming Talindia trainings: SAP & Advanced Excel, teaching for GCC schools, digital sales and data analytics.",
    path: "/trainings/",
  });
}

async function Results({ searchParams }: { searchParams: PageProps<"/trainings">["searchParams"] }) {
  const sp = await searchParams;
  const q = parseListing(sp, { sorts: ["order"] as const, defaultSort: "order", defaultPageSize: 10 });
  const availability = pickEnum(sp.status, COURSE_AVAILABILITY);
  const result = await getCourses({ search: q.search, availability, page: q.page, pageSize: q.pageSize });

  if (!result.data.length) {
    return (
      <EmptyState
        title={q.search || availability ? "No trainings match your search" : "No trainings published yet"}
        description={q.search || availability ? "Try a different word, or clear the filters to see every training." : "New trainings are announced here first."}
        action={q.search || availability ? { href: "/trainings/", label: "Clear filters" } : { href: "/contact/", label: "Ask us about upcoming trainings" }}
        className="bg-paper"
      />
    );
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-2">
        {result.data.map((c) => (
          <li key={c.id}>
            <Link href={`/courses/${c.slug}/`} className="group grid grid-cols-[96px_1fr] gap-4 bg-paper p-3 transition-colors hover:bg-ink sm:grid-cols-[220px_1fr_auto] sm:gap-6 sm:p-4">
              <div className="relative aspect-[3/2] overflow-hidden bg-field">
                {c.image && (
                  <Image src={mediaUrl(c.image.key)} alt={c.image.alt || ""} fill sizes="(min-width: 640px) 220px, 96px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <div className="min-w-0 self-center">
                <h2 className="text-lg leading-snug font-bold text-ink group-hover:text-white sm:text-2xl">{c.title}</h2>
                <p className="mt-1 text-base text-soft group-hover:text-on-dark-soft">{c.audience}</p>
                {c.highlights.length > 0 && (
                  <p className="mt-2 hidden text-base text-ink group-hover:text-on-dark sm:block">{c.highlights.slice(0, 2).join(" · ")}</p>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                <span className="inline-flex items-center gap-1.5 bg-ink px-2.5 py-1 text-sm font-bold text-white group-hover:bg-violet">
                  <Plane className="size-3.5" aria-hidden /> {AVAILABILITY_LABEL[c.availability]}
                </span>
                <span className="inline-flex items-center gap-1 text-base font-bold text-violet group-hover:text-white">
                  View training <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <DataPagination tone="site" page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} />
    </div>
  );
}

async function Intro() {
  const page = await getPage("trainings");
  return <>{page?.intro ? <p className="mt-8 max-w-2xl text-xl leading-relaxed text-ink">{page.intro}</p> : null}</>;
}

export default function TrainingsPage(props: PageProps<"/trainings">) {
  return (
    <>
      <PageHeader title="Trainings">
        <Suspense fallback={null}>
          <Intro />
        </Suspense>
      </PageHeader>
      <section aria-label="Training list" className="bg-ground pb-24 sm:pb-32">
        <div className="frame space-y-6">
          <Suspense fallback={<div className="h-12 bg-paper" />}>
            <TrainingsToolbar />
          </Suspense>
          <Suspense fallback={<CourseListSkeleton rows={4} />}>
            <Results searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
