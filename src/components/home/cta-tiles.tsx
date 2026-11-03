import Image from "next/image";
import { SectionMotion } from "@/components/motion/section-motion";
import { ButtonLink } from "@/components/site/button-link";
import type { Settings } from "@/lib/settings-schema";

/** The close: one accent tile for the free webinar between two photographs — Kozhikode's shore and the Gulf skyline. */
export function CtaTiles({ webinar, contactHref = "/contact/" }: { webinar: Settings["webinar"]; contactHref?: string }) {
  const [question, ...restParts] = (webinar.title || "Ready for your next role?").split("?");
  const rest = restParts.join("?").trim();
  const show = webinar.enabled && webinar.title;
  return (
    <SectionMotion kind="cta">
    <section aria-labelledby="cta-title" className="overflow-hidden bg-ground pb-24 sm:pb-32">
      <div className="grid gap-2.5 px-2.5 sm:gap-3 sm:px-0 lg:grid-cols-[1fr_minmax(0,5fr)_1fr]">
        <div data-m="photo-l" className="relative order-2 hidden h-[420px] overflow-hidden rounded-[2rem] sm:-ml-8 sm:block lg:order-none">
          <Image src="/images/kozhikode-beach.webp" alt="Sunset over the Arabian Sea at Kozhikode beach" fill sizes="(min-width: 1024px) 15vw, 50vw" className="object-cover" />
        </div>
        <div data-m="tile" className="flex min-h-[340px] flex-col justify-center rounded-[2rem] bg-violet p-8 text-white sm:mx-4 sm:p-12 lg:mx-0 lg:h-[420px] lg:p-16">
          <h2 id="cta-title" data-m="heading" className="max-w-[22ch] text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-[44px]">
            {question}
            {restParts.length ? "?" : ""}
          </h2>
          <p data-m="fade" className="mt-4 max-w-[52ch] text-lg leading-relaxed text-white">
            {show ? `${rest} ${webinar.text}`.trim() : "Tell us where you are in your career and the Talindia team will suggest the right training."}
          </p>
          <div data-m="fade" className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={show ? webinar.ctaHref : contactHref} variant="light" size="lg">
              {show ? webinar.ctaLabel || "Register your interest" : "Connect With Us"}
            </ButtonLink>
          </div>
        </div>
        <div data-m="photo-r" className="relative order-3 hidden h-[420px] overflow-hidden rounded-[2rem] sm:-mr-8 sm:block lg:order-none">
          <Image src="/images/dubai-skyline.webp" alt="Dubai skyline with the Burj Khalifa" fill sizes="(min-width: 1024px) 15vw, 50vw" className="object-cover" />
        </div>
      </div>
    </section>
    </SectionMotion>
  );
}
