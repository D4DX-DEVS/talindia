import "server-only";
import type { Metadata } from "next";
import { getSettings, mediaUrl } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/site-url";

interface MetaInput {
  /** Page title without the site suffix; omit for the default site title. */
  title?: string | null;
  description?: string | null;
  path: string;
  imageKey?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}

export async function buildMetadata({ title, description, path, imageKey, noindex, type = "website" }: MetaInput): Promise<Metadata> {
  const { seo, site } = await getSettings();
  const fullTitle = title ? seo.titleTemplate.replace("%s", title) : seo.defaultTitle;
  const desc = (description || seo.defaultDescription).slice(0, 300);
  const image = imageKey || seo.ogImageKey;
  const images = image ? [{ url: absoluteUrl(mediaUrl(image)) }] : undefined;
  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: absoluteUrl(path) },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { type, url: absoluteUrl(path), siteName: site.name, title: fullTitle, description: desc, images, locale: "en_IN" },
    twitter: { card: images ? "summary_large_image" : "summary", title: fullTitle, description: desc, images: images?.map((i) => i.url) },
  };
}

/** schema.org Organization / EducationalOrganization JSON-LD for the whole site. */
export async function organizationJsonLd(): Promise<Record<string, unknown>> {
  const { site, contact, social } = await getSettings();
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.name,
    slogan: site.tagline,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-dark.png"),
    email: contact.email,
    telephone: contact.phone.replace(/\s+/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.replace(/\s*Calicut.*$/i, "").trim(),
      addressLocality: "Calicut",
      addressRegion: "Kerala",
      postalCode: contact.address.match(/\b\d{6}\b/)?.[0],
      addressCountry: "IN",
    },
    sameAs: social.map((s) => s.url),
  };
}
