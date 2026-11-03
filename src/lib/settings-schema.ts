import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const href = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^(https?:|mailto:|tel:)/.test(v), "Use a site path (/...) or a full URL");

export const settingsSchemas = {
  site: z.object({
    name: text(60).min(1),
    tagline: text(120),
    title: text(120).min(1),
    footerText: text(600),
    copyrightHolder: text(80).min(1),
  }),
  contact: z.object({
    email: z.email().max(200),
    phone: text(40).min(5),
    phoneHref: text(60).regex(/^tel:\+?[0-9]+$/, "Format: tel:+919999999999"),
    address: text(300).min(5),
    mapQuery: text(300),
  }),
  hero: z.object({
    eyebrow: text(120),
    title: text(60).min(1),
    subtitle: text(240),
    imageKey: text(300),
    ctaLabel: text(40).min(1),
    ctaHref: href,
    secondaryLabel: text(40),
    secondaryCaption: text(80),
    secondaryHref: href,
  }),
  homeAbout: z.object({
    eyebrow: text(60),
    heading: text(120).min(1),
    text: text(1200),
    imageKey: text(300),
    ctaLabel: text(40),
    ctaHref: href,
  }),
  webinar: z.object({
    enabled: z.boolean(),
    title: text(160),
    text: text(400),
    ctaLabel: text(40),
    ctaHref: href,
  }),
  sections: z.object({
    coursesHeading: text(80).min(1),
    whyEyebrow: text(60),
    whyHeading: text(80).min(1),
    offeringsEyebrow: text(60),
    offeringsHeading: text(80).min(1),
    testimonialsEyebrow: text(60),
    testimonialsHeading: text(120).min(1),
  }),
  seo: z.object({
    defaultTitle: text(120).min(1),
    titleTemplate: text(80).refine((v) => v.includes("%s"), "Must contain %s"),
    defaultDescription: text(320),
    ogImageKey: text(300),
  }),
  social: z
    .array(z.object({ label: text(40).min(1), url: z.url().max(300) }))
    .max(10),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };
export const SETTINGS_KEYS = Object.keys(settingsSchemas) as SettingsKey[];
