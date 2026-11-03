import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
};

const seo = {
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
};

export const PUBLISH_STATUSES = ["draft", "published"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    title: text("title").notNull().default(""),
    sha256: text("sha256"),
    legacyUrl: text("legacy_url"),
    legacyWpId: integer("legacy_wp_id"),
    uploadedBy: text("uploaded_by"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("media_key_uq").on(t.key),
    index("media_mime_idx").on(t.mimeType),
    index("media_created_idx").on(t.createdAt),
  ],
);

export const COURSE_AVAILABILITY = ["coming_soon", "open", "closed"] as const;
export type CourseAvailability = (typeof COURSE_AVAILABILITY)[number];

export const courses = sqliteTable(
  "courses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    audience: text("audience").notNull().default(""),
    highlights: text("highlights", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    marketGap: text("market_gap"),
    category: text("category").notNull().default(""),
    availability: text("availability", { enum: COURSE_AVAILABILITY }).notNull().default("coming_soon"),
    imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status", { enum: PUBLISH_STATUSES }).notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    legacyWpId: integer("legacy_wp_id"),
    ...seo,
    ...timestamps,
  },
  (t) => [
    uniqueIndex("courses_slug_uq").on(t.slug),
    index("courses_status_sort_idx").on(t.status, t.sortOrder),
    index("courses_category_idx").on(t.category),
  ],
);

export const services = sqliteTable(
  "services",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    highlights: text("highlights", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    icon: text("icon").notNull().default("sparkles"),
    imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status", { enum: PUBLISH_STATUSES }).notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    legacyWpId: integer("legacy_wp_id"),
    ...seo,
    ...timestamps,
  },
  (t) => [uniqueIndex("services_slug_uq").on(t.slug), index("services_status_sort_idx").on(t.status, t.sortOrder)],
);

export const FEATURE_GROUPS = ["why_choose", "offerings"] as const;
export type FeatureGroup = (typeof FEATURE_GROUPS)[number];

export const features = sqliteTable(
  "features",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    group: text("group", { enum: FEATURE_GROUPS }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("sparkles"),
    status: text("status", { enum: PUBLISH_STATUSES }).notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("features_group_sort_idx").on(t.group, t.status, t.sortOrder)],
);

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quote: text("quote").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default(""),
    status: text("status", { enum: PUBLISH_STATUSES }).notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("testimonials_status_sort_idx").on(t.status, t.sortOrder)],
);

export const pages = sqliteTable(
  "pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    intro: text("intro").notNull().default(""),
    body: text("body").notNull().default(""),
    imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status", { enum: PUBLISH_STATUSES }).notNull().default("draft"),
    /** System pages (home, about, contact, trainings) cannot be deleted or re-slugged. */
    system: integer("system", { mode: "boolean" }).notNull().default(false),
    legacyWpId: integer("legacy_wp_id"),
    ...seo,
    ...timestamps,
  },
  (t) => [uniqueIndex("pages_slug_uq").on(t.slug), index("pages_status_idx").on(t.status)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const ENQUIRY_STATUSES = ["new", "in_progress", "closed", "spam"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const enquiries = sqliteTable(
  "enquiries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    website: text("website"),
    subject: text("subject"),
    message: text("message").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
    sourcePath: text("source_path"),
    status: text("status", { enum: ENQUIRY_STATUSES }).notNull().default("new"),
    notes: text("notes"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    index("enquiries_status_created_idx").on(t.status, t.createdAt),
    index("enquiries_email_idx").on(t.email),
    index("enquiries_course_idx").on(t.courseId),
  ],
);

export const subscribers = sqliteTable(
  "subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    status: text("status", { enum: ["subscribed", "unsubscribed"] }).notNull().default("subscribed"),
    sourcePath: text("source_path"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [uniqueIndex("subscribers_email_uq").on(t.email), index("subscribers_created_idx").on(t.createdAt)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only ever lives in the cookie. */
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("sessions_expires_idx").on(t.expiresAt)],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.key] })],
);

export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull().default(""),
    ipHash: text("ip_hash"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("activity_created_idx").on(t.createdAt), index("activity_entity_idx").on(t.entityType, t.entityId)],
);

export type Media = typeof media.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type ActivityEntry = typeof activityLog.$inferSelect;
