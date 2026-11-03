import { Quote } from "lucide-react";
import { SectionMotion } from "@/components/motion/section-motion";
import type { PublicTestimonial } from "@/lib/data/public";

/** One large voice beside the violet circle, two smaller ones beneath. */
export function Testimonials({ heading, items }: { heading: string; items: PublicTestimonial[] }) {
  if (!items.length) return null;
  const [lead, ...rest] = items;
  return (
    <SectionMotion kind="testimonials">
    <section aria-labelledby="testimonials-title" className="relative isolate overflow-hidden bg-ground py-24 sm:py-32 lg:py-40">
      <div aria-hidden data-m="circle" className="absolute -top-[30vw] -right-[24vw] -z-10 flex size-[56vw] sm:-top-[18vw] sm:-right-[18vw] items-end justify-start rounded-full bg-violet p-[12vw] lg:size-[44vw] lg:p-[9vw]">
        <Quote data-m="quote-icon" className="size-[12vw] text-white lg:size-[8vw]" />
      </div>
      <div className="frame">
        <h2 id="testimonials-title" data-m="heading" className="max-w-[16ch] text-4xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[clamp(44px,4.4vw,72px)]">
          {heading}
        </h2>
        <figure className="mt-14 max-w-[44ch] lg:mt-20">
          <blockquote data-m="lead" className="text-2xl leading-snug font-medium text-ink lg:text-[34px]">&ldquo;{lead.quote}&rdquo;</blockquote>
          <figcaption data-m="lead-caption" className="mt-6 text-lg">
            <span className="font-bold text-ink">{lead.name}</span>
            {lead.role && <span className="text-soft"> · {lead.role}</span>}
          </figcaption>
        </figure>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:mt-24 lg:w-2/3">
          {rest.map((t) => (
            <figure key={t.id} data-m="card" className="rounded-[2rem] bg-paper p-6 sm:p-8">
              <blockquote className="text-base leading-relaxed text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-base">
                <span className="block font-bold text-ink">{t.name}</span>
                {t.role && <span className="block text-soft">{t.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
