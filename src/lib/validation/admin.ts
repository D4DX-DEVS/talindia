import { z } from "zod";
import { COURSE_AVAILABILITY, ENQUIRY_STATUSES, FEATURE_GROUPS, PUBLISH_STATUSES } from "@/db/schema";

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only");

const seoFields = {
  seoTitle: z.string().trim().max(120).optional().default(""),
  seoDescription: z.string().trim().max(320).optional().default(""),
};

const lines = z.array(z.string().trim().min(1).max(300)).max(30);

export const courseSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(160),
  slug: slugSchema,
  audience: z.string().trim().min(3, "Who is this training for?").max(300),
  highlights: lines,
  marketGap: z.string().trim().max(400).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  availability: z.enum(COURSE_AVAILABILITY),
  status: z.enum(PUBLISH_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  imageId: z.coerce.number().int().positive().nullable().optional().default(null),
  ...seoFields,
});
export type CourseInput = z.input<typeof courseSchema>;

export const serviceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: slugSchema,
  summary: z.string().trim().max(400).optional().default(""),
  highlights: lines,
  icon: z.string().trim().min(1).max(40),
  status: z.enum(PUBLISH_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  imageId: z.coerce.number().int().positive().nullable().optional().default(null),
  ...seoFields,
});
export type ServiceInput = z.input<typeof serviceSchema>;

export const featureSchema = z.object({
  group: z.enum(FEATURE_GROUPS),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional().default(""),
  icon: z.string().trim().min(1).max(40),
  status: z.enum(PUBLISH_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});
export type FeatureInput = z.input<typeof featureSchema>;

export const testimonialSchema = z.object({
  quote: z.string().trim().min(10).max(800),
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120).optional().default(""),
  status: z.enum(PUBLISH_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});
export type TestimonialInput = z.input<typeof testimonialSchema>;

export const pageSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  intro: z.string().trim().max(600).optional().default(""),
  body: z.string().max(50_000).optional().default(""),
  status: z.enum(PUBLISH_STATUSES),
  imageId: z.coerce.number().int().positive().nullable().optional().default(null),
  ...seoFields,
});
export type PageInput = z.input<typeof pageSchema>;

export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  notes: z.string().trim().max(4000).optional().default(""),
});
export type EnquiryUpdateInput = z.input<typeof enquiryUpdateSchema>;

export const mediaUpdateSchema = z.object({
  alt: z.string().trim().max(300).optional().default(""),
  title: z.string().trim().max(200).optional().default(""),
});
export type MediaUpdateInput = z.input<typeof mediaUpdateSchema>;

export const idSchema = z.coerce.number().int().positive();

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
