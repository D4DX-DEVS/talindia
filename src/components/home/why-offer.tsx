import { SectionMotion } from "@/components/motion/section-motion";
import { cn } from "@/lib/utils";
import type { PublicFeature } from "@/lib/data/public";

interface WhyOfferProps {
  whyHeading: string;
  offeringsHeading: string;
  why: PublicFeature[];
  offerings: PublicFeature[];
}

/** Three reasons set large, then the six offerings as a two-column list. */
export function WhyOffer({ whyHeading, offeringsHeading, why, offerings }: WhyOfferProps) {
  return (
    <SectionMotion kind="whyOffer">
    <section aria-labelledby="why-title" className="bg-ground py-24 sm:py-32 lg:py-40">
      <div className="frame">
        <h2 id="why-title" data-m="heading" className="max-w-[16ch] text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-[clamp(48px,5vw,80px)]">
          {whyHeading}
        </h2>
        <ul className="mt-12 grid gap-10 sm:grid-cols-3 lg:mt-16 lg:gap-8">
          {why.map((f, i) => (
            <li key={f.id} data-m="why">
              <span data-m="rule" className="mb-6 block h-px bg-ink/25" aria-hidden />
              <span className="tnum mb-3 block text-sm font-bold text-violet" aria-hidden>0<span data-m="index">{i + 1}</span></span>
              <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{f.title}</h3>
              <p className="mt-3 max-w-[38ch] text-lg leading-relaxed text-ink">{f.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-24 grid gap-10 sm:mt-32 lg:grid-cols-12 lg:gap-8">
          <h2 data-m="heading" className="text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl lg:col-span-4">{offeringsHeading}</h2>
          <dl className="lg:col-span-8">
            {offerings.map((f, i) => (
              <div key={f.id} data-m="offer" className={cn("grid gap-2 py-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:gap-8", i % 2 === 0 ? "bg-transparent" : "bg-field px-4 sm:px-6")}>
                <dt className="text-2xl leading-tight font-extrabold tracking-tight text-indigo sm:text-3xl">{f.title}</dt>
                <dd className="text-lg leading-relaxed text-ink">{f.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
