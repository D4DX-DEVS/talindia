import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionMotion } from "@/components/motion/section-motion";
import { ButtonLink } from "@/components/site/button-link";
import { mediaUrl, serviceHasPage, type ImageRef, type PublicService } from "@/lib/data/public";
import type { Settings } from "@/lib/settings-schema";

interface AboutPanelProps {
  about: Settings["homeAbout"];
  services: PublicService[];
  /** The illustration picked in admin; null falls back to the pre-optimised brand illustration. */
  illustration?: ImageRef | null;
}

/** A light panel inset on the dark page: the statement, the illustration in the circle, then what Talindia does. */
export function AboutPanel({ about, services, illustration = null }: AboutPanelProps) {
  return (
    <SectionMotion kind="about">
    <section aria-labelledby="about-title" className="bg-night px-2.5 pb-2.5 sm:px-5 sm:pb-5">
      <div data-m="panel" className="relative overflow-hidden rounded-[2rem] bg-ground">
        <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-14">
          <div className="lg:col-span-6">
            <h2 id="about-title" data-m="heading" className="max-w-[18ch] text-[9vw] leading-[1.02] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[clamp(40px,4vw,60px)]">
              {about.heading}
            </h2>
            <p data-m="fade" className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ink">{about.text}</p>
            {about.ctaLabel && (
              <ButtonLink href={about.ctaHref} variant="ink" size="lg" className="mt-10">
                {about.ctaLabel}
              </ButtonLink>
            )}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h3 className="mb-4 text-xl font-bold text-ink">What we do</h3>
            <ul className="space-y-2">
              {services.map((s) => {
                const inner = (
                  <>
                    <span data-m="service-img" className="relative size-16 shrink-0 overflow-hidden rounded-full bg-violet sm:size-20">
                      {s.image && (
                        <Image src={mediaUrl(s.image.key)} alt="" fill sizes="80px" className="object-cover object-top" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg leading-snug font-bold text-ink">{s.title}</span>
                      {s.summary && <span className="block text-base text-soft">{s.summary}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={s.id} data-m="service">
                    {serviceHasPage(s) ? (
                      <Link href={`/all-service/${s.slug}/`} className="group flex items-center gap-4 rounded-full bg-paper p-2 pr-5 transition-colors hover:bg-field">
                        {inner}
                        <ArrowUpRight className="size-5 text-violet transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 rounded-full bg-paper p-2 pr-5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto mb-[-14%] aspect-square w-[80vw] sm:w-[52vw] lg:absolute lg:bottom-0 lg:left-[44%] lg:mb-0 lg:w-[22vw] lg:translate-y-[38%]" aria-hidden>
          <div data-m="illustration" className="absolute inset-0 overflow-hidden rounded-full bg-paper">
            <Image src={illustration ? mediaUrl(illustration.key) : "/images/about-illustration.webp"} alt="" fill sizes="(min-width: 1024px) 22vw, 80vw" className="object-contain p-[10%]" />
          </div>
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
