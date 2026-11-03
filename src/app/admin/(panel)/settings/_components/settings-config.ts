import type { SettingsKey } from "@/lib/settings-schema";

export type FieldKind = "text" | "textarea" | "image" | "switch" | "email" | "href";

export interface SettingField {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  required?: boolean;
}

export interface SettingSection {
  key: Exclude<SettingsKey, "social">;
  title: string;
  description: string;
  fields: SettingField[];
}

const href = "A site path such as /contact/ or a full https:// URL.";

export const SETTING_SECTIONS: SettingSection[] = [
  {
    key: "site",
    title: "Site identity",
    description: "Name and footer text used across the website.",
    fields: [
      { name: "name", label: "Site name", kind: "text", required: true, hint: "Also the giant wordmark in the footer." },
      { name: "tagline", label: "Tagline", kind: "text" },
      { name: "title", label: "Browser title", kind: "text", required: true },
      { name: "footerText", label: "Footer text", kind: "textarea" },
      { name: "copyrightHolder", label: "Copyright holder", kind: "text", required: true },
    ],
  },
  {
    key: "contact",
    title: "Contact details",
    description: "Shown in the footer, the contact page and structured data for search engines.",
    fields: [
      { name: "email", label: "Email", kind: "email", required: true },
      { name: "phone", label: "Phone (as displayed)", kind: "text", required: true },
      { name: "phoneHref", label: "Phone link", kind: "text", required: true, hint: "Format: tel:+919746376753" },
      { name: "address", label: "Address", kind: "textarea", required: true },
      { name: "mapQuery", label: "Map search text", kind: "text", hint: "What Google Maps searches for when the address is clicked." },
    ],
  },
  {
    key: "hero",
    title: "Home page hero",
    description: "The first screen of the home page.",
    fields: [
      { name: "title", label: "Headline", kind: "text", required: true, hint: "The last sentence goes on the second line, e.g. “Upskill. Reskill. Get Placed”." },
      { name: "eyebrow", label: "Lead-in (bold)", kind: "text" },
      { name: "subtitle", label: "Supporting sentence", kind: "textarea" },
      { name: "imageKey", label: "Portrait image", kind: "image", hint: "Leave empty to use the built-in brand portrait (fastest). A tall cut-out PNG on a transparent background works best." },
      { name: "ctaLabel", label: "Button label", kind: "text", required: true },
      { name: "ctaHref", label: "Button link", kind: "href", hint: href },
      { name: "secondaryLabel", label: "Chat card title", kind: "text" },
      { name: "secondaryCaption", label: "Chat card caption", kind: "text" },
      { name: "secondaryHref", label: "Chat card link", kind: "href", hint: href },
    ],
  },
  {
    key: "homeAbout",
    title: "Home page about panel",
    description: "The light panel below the hero.",
    fields: [
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "text", label: "Text", kind: "textarea" },
      { name: "imageKey", label: "Illustration (in the circle)", kind: "image", hint: "Leave empty to use the built-in brand illustration. Square images work best." },
      { name: "ctaLabel", label: "Button label", kind: "text" },
      { name: "ctaHref", label: "Button link", kind: "href", hint: href },
    ],
  },
  {
    key: "webinar",
    title: "Webinar banner",
    description: "The violet card near the bottom of the home page. When hidden, the card invites visitors to contact you instead.",
    fields: [
      { name: "enabled", label: "Show the banner", kind: "switch" },
      { name: "title", label: "Title", kind: "text", hint: "Text up to the first “?” becomes the heading." },
      { name: "text", label: "Supporting text", kind: "textarea" },
      { name: "ctaLabel", label: "Button label", kind: "text" },
      { name: "ctaHref", label: "Button link", kind: "href", hint: href },
    ],
  },
  {
    key: "sections",
    title: "Section headings",
    description: "Headings above the trainings and testimonials on the home page, and the two lists on the About us page.",
    fields: [
      { name: "coursesHeading", label: "Home: trainings heading", kind: "text", required: true },
      { name: "testimonialsHeading", label: "Home: testimonials heading", kind: "text", required: true },
      { name: "whyHeading", label: "About us: why choose heading", kind: "text", required: true },
      { name: "offeringsHeading", label: "About us: offerings heading", kind: "text", required: true },
    ],
  },
  {
    key: "seo",
    title: "SEO defaults",
    description: "Used when a page has no SEO title or description of its own.",
    fields: [
      { name: "defaultTitle", label: "Default title", kind: "text", required: true },
      { name: "titleTemplate", label: "Title template", kind: "text", required: true, hint: "%s is replaced by the page title, e.g. “%s | Talindia”." },
      { name: "defaultDescription", label: "Default description", kind: "textarea", hint: "About 155 characters." },
      { name: "ogImageKey", label: "Social sharing image", kind: "image", hint: "Shown when a link is shared on social media (1200×630 works best)." },
    ],
  },
];
