import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionMotion } from "@/components/motion/section-motion";
import { ButtonLink } from "@/components/site/button-link";
import { AVAILABILITY_LABEL } from "@/lib/course";
import { mediaUrl, type PublicCourse } from "@/lib/data/public";

/** Trainings as a two-column list; each course photograph sits in the page's circle where a bullet would be. */
export function TrainingsList({ heading, courses }: { heading: string; courses: PublicCourse[] }) {
  return (
    <SectionMotion kind="trainings">
    <section aria-labelledby="trainings-title" className="bg-night py-24 text-on-dark sm:py-32 lg:py-40">
      <div className="frame">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="trainings-title" data-m="heading" className="text-5xl leading-[0.95] font-extrabold tracking-tight text-white sm:text-6xl lg:text-[clamp(48px,5vw,80px)]">
            {heading}
          </h2>
          <p className="text-lg text-on-dark-soft"><span data-m="count" className="tnum">{courses.length}</span> trainings for careers in India and the Gulf</p>
        </div>
        <ul className="mt-12 grid gap-x-16 gap-y-4 lg:mt-16 lg:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id} data-m="card">
              <Link href={`/courses/${c.slug}/`} data-cursor="View" className="spotlight group flex gap-5 rounded-[2rem] bg-night-soft p-4 transition-colors hover:bg-indigo-deep sm:gap-6 sm:p-5">
                <span data-m="thumb" className="relative size-20 shrink-0 overflow-hidden rounded-full bg-indigo sm:size-24">
                  {c.image && <Image src={mediaUrl(c.image.key)} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                </span>
                <span className="min-w-0 flex-1 self-center">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-lg leading-snug font-bold text-white sm:text-xl">{c.title}</span>
                    <span className="rounded-full bg-violet px-2.5 py-0.5 text-sm font-semibold text-white">{AVAILABILITY_LABEL[c.availability]}</span>
                  </span>
                  <span className="mt-1 block text-base text-on-dark">{c.audience}</span>
                  {c.highlights[0] && <span className="mt-1 block text-base text-on-dark-soft">{c.highlights[0]}</span>}
                </span>
                <ArrowRight className="size-5 shrink-0 self-center text-violet-pale transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <div data-m="fade" className="mt-12">
          <ButtonLink href="/trainings/" variant="light" size="lg">More Courses</ButtonLink>
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
