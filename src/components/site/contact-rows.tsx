import { ArrowRight } from "lucide-react";
import type { Settings } from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

/** The address set as full-width display rows; street and phone rows are links (map, call). */
export function ContactRows({ contact, headingId, title = "Connect With Us" }: { contact: Settings["contact"]; headingId: string; title?: string }) {
  const parts = contact.address.split(",").map((p) => p.trim());
  // "1st floor, 2nd Phase, Hilite Business Park Calicut, Kerala 673014"
  const building = parts.slice(0, -1).join(", ").replace(/\s+Calicut$/i, "");
  const city = `Calicut, ${parts[parts.length - 1]}`;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.mapQuery || contact.address)}`;
  const row = "flex min-h-20 items-end px-4 pb-3 text-[8vw] leading-none font-semibold tracking-tight sm:min-h-28 sm:px-5 sm:text-[6vw] lg:min-h-36 lg:text-[clamp(44px,6vw,88px)]";

  return (
    <section aria-labelledby={headingId} className="bg-ground py-24 sm:py-32">
      <div className="frame">
        <h2 id={headingId} className="mb-8 px-4 text-xl font-bold text-indigo sm:px-5">{title}</h2>
        <a href={map} target="_blank" rel="noopener noreferrer" className={cn(row, "bg-field transition-colors hover:bg-ink hover:text-white")}>
          {building}
        </a>
        <p className={cn(row, "bg-ground")}>{city}</p>
        <a href={contact.phoneHref} className={cn(row, "tnum bg-field transition-colors hover:bg-ink hover:text-white")}>
          {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className={cn(row, "group gap-4 bg-violet text-white transition-colors hover:bg-indigo")}>
          <span className="break-all">{contact.email}</span>
          <span className="mb-1 inline-flex size-[0.9em] shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-2">
            <ArrowRight className="size-1/2" aria-hidden />
          </span>
        </a>
      </div>
    </section>
  );
}
