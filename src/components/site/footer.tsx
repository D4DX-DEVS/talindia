import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getServices, getSettings, serviceHasPage } from "@/lib/data/public";
import { placeCredits } from "@/lib/credits";
import { NAV_ACTION, NAV_ITEMS } from "./nav-items";
import { NewsletterForm } from "./newsletter-form";
import { SectionMotion } from "@/components/motion/section-motion";

export async function SiteFooter() {
  const [{ site, contact, social }, services] = await Promise.all([getSettings(), getServices()]);
  const year = new Date().getFullYear();
  const linkCls = "inline-flex min-h-11 items-center text-on-dark-soft transition-colors hover:text-white sm:min-h-9";

  return (
    <SectionMotion kind="footer">
    <footer className="mt-auto bg-night text-on-dark">
      <div className="frame grid gap-10 pt-14 pb-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:pt-20">
        <div data-m="col" className="sm:col-span-2 lg:col-span-4">
          <p className="max-w-md text-base leading-relaxed text-on-dark-soft">{site.footerText}</p>
          <div className="mt-6 max-w-sm">
            <NewsletterForm />
          </div>
        </div>
        <nav aria-label="Footer" data-m="col" className="lg:col-span-2 lg:col-start-6">
          <h2 className="mb-2 text-base font-bold text-white">Pages</h2>
          <ul>
            {[...NAV_ITEMS, NAV_ACTION].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div data-m="col" className="lg:col-span-2">
          <h2 className="mb-2 text-base font-bold text-white">Services</h2>
          <ul>
            {services.map((s) => (
              <li key={s.id}>
                {serviceHasPage(s) ? (
                  <Link href={`/all-service/${s.slug}/`} className={linkCls}>{s.title}</Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center text-on-dark-soft sm:min-h-9">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <address data-m="col" className="not-italic lg:col-span-3">
          <h2 className="mb-2 text-base font-bold text-white">Contact Us</h2>
          <ul className="space-y-1">
            <li className="flex gap-3 py-2 text-on-dark-soft">
              <MapPin className="mt-0.5 size-5 shrink-0 text-violet-pale" aria-hidden />
              <span>{contact.address}</span>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className={`${linkCls} gap-3`}>
                <Mail className="size-5 shrink-0 text-violet-pale" aria-hidden />
                {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className={`${linkCls} tnum gap-3`}>
                <Phone className="size-5 shrink-0 text-violet-pale" aria-hidden />
                {contact.phone}
              </a>
            </li>
          </ul>
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-5">
              {social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank" className={linkCls}>{s.label}</a>
                </li>
              ))}
            </ul>
          )}
        </address>
      </div>
      <div className="frame overflow-hidden" aria-hidden>
        <p data-m="wordmark" className="display -mb-[0.12em] text-center text-[19.5vw] leading-[0.8] text-night-soft select-none lg:text-[18.4vw] 2xl:text-[265px]">
          {site.name}
        </p>
      </div>
      <div className="bg-night">
        <div className="frame flex flex-col gap-2 py-5 text-[13px] text-on-dark-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy;{year} {site.copyrightHolder}. All Rights Reserved. Powered by D4DX
          </p>
          <p>
            Photos:{" "}
            {placeCredits.map((c, i) => (
              <span key={c.page}>
                {i > 0 && "; "}
                <a href={c.page} rel="noopener noreferrer" target="_blank" className="underline-offset-2 hover:text-white hover:underline">
                  {c.title}
                </a>{" "}
                by {c.creator},{" "}
                <a href={c.licenseUrl} rel="noopener noreferrer" target="_blank" className="underline-offset-2 hover:text-white hover:underline">
                  {c.license}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
    </SectionMotion>
  );
}

export function SiteFooterSkeleton() {
  return <div className="mt-auto h-[480px] bg-night" aria-hidden />;
}
