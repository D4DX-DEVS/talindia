import Image from "next/image";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { SectionMotion } from "@/components/motion/section-motion";
import { ButtonLink } from "@/components/site/button-link";
import { mediaUrl, type ImageRef } from "@/lib/data/public";
import type { Settings } from "@/lib/settings-schema";

/** "Upskill . Reskill. Get Placed" -> ["Upskill. Reskill.", "Get Placed"]: the last sentence takes the second line. */
export function splitHeadline(title: string): [string, string | null] {
  const sentences = title.replace(/\s+\.\s*/g, ". ").trim().match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [title];
  if (sentences.length < 2) return [title.trim(), null];
  return [sentences.slice(0, -1).join(" "), sentences[sentences.length - 1]];
}

interface HeroProps {
  hero: Settings["hero"];
  /** The portrait picked in admin; null falls back to the pre-optimised brand portrait. */
  portrait?: ImageRef | null;
}

/** The arc of the Talindia mark, enlarged into one violet disc that holds the portrait. */
export function Hero({ hero, portrait = null }: HeroProps) {
  const [first, second] = splitHeadline(hero.title);
  return (
    <SectionMotion kind="hero" hideUntilReady>
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-night text-on-dark">
      <div aria-hidden data-m="disc" className="absolute -right-[38vw] -bottom-[62vw] -z-10 size-[150vw] rounded-full bg-violet sm:-right-[30vw] sm:-bottom-[40vw] sm:size-[110vw] lg:top-1/2 lg:-right-[24vh] lg:bottom-auto lg:size-[118vh] lg:-translate-y-[42%]" />
      <div className="frame relative grid min-h-[calc(100svh-4rem)] items-center gap-10 pt-14 pb-0 sm:min-h-[calc(100svh-4.5rem)] lg:grid-cols-12 lg:pt-0">
        <div className="relative z-10 lg:col-span-7 lg:pb-16">
          <h1 id="hero-title" className="text-[13.5vw] leading-[0.95] font-extrabold tracking-[-0.04em] text-white sm:text-[9vw] lg:text-[clamp(64px,6.6vw,118px)]">
            <span data-m="line" className="block">{first}</span>
            {second && <span data-m="line" className="block text-violet-pale">{second}</span>}
          </h1>
          <p data-m="fade" className="mt-8 max-w-[44ch] text-lg leading-relaxed text-on-dark sm:text-xl">
            {hero.eyebrow}. {hero.subtitle}
          </p>
          <div data-m="fade" className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href={hero.ctaHref} variant="light" size="lg">{hero.ctaLabel}</ButtonLink>
            {hero.secondaryLabel && (
              <Link href={hero.secondaryHref} className="group inline-flex min-h-12 items-center gap-3 text-base font-semibold text-white">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-violet">
                  <MessagesSquare className="size-5" aria-hidden />
                </span>
                <span>
                  {hero.secondaryLabel}
                  <span className="block text-sm font-normal text-on-dark-soft">{hero.secondaryCaption}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
        <div data-m="portrait" className="relative h-[62svh] min-h-[360px] self-end sm:h-[70svh] lg:col-span-5 lg:h-[88svh]">
          <Image
            src={portrait ? mediaUrl(portrait.key) : "/images/hero-portrait.webp"}
            alt={portrait ? portrait.alt : "Smiling professional in a suit holding documents"}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
