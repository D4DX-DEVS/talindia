import "server-only";
import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityLog, courses, enquiries, subscribers, ENQUIRY_STATUSES, type EnquiryStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { paginate, type ListingQuery, type Paginated } from "@/lib/listing";
import { orderBy, searchAcross } from "./queries";

// ------------------------------------------------------------ enquiries

export const ENQUIRY_SORTS = ["created", "name", "status"] as const;
export type EnquirySort = (typeof ENQUIRY_SORTS)[number];

export interface EnquiryFilters {
  status?: string;
  course?: string;
}

export interface AdminEnquiryRow {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  status: EnquiryStatus;
  createdAt: Date;
  courseId: number | null;
  courseTitle: string | null;
}

function enquiryWhere(search: string, f: EnquiryFilters): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  if (f.status && (ENQUIRY_STATUSES as readonly string[]).includes(f.status)) where.push(eq(enquiries.status, f.status as EnquiryStatus));
  const courseId = Number(f.course);
  if (Number.isInteger(courseId) && courseId > 0) where.push(eq(enquiries.courseId, courseId));
  where.push(searchAcross(search, [enquiries.name, enquiries.email, enquiries.subject, enquiries.message]));
  return and(...where);
}

const enquiryCols = {
  id: enquiries.id,
  name: enquiries.name,
  email: enquiries.email,
  subject: enquiries.subject,
  status: enquiries.status,
  createdAt: enquiries.createdAt,
  courseId: enquiries.courseId,
  courseTitle: courses.title,
};

export async function listEnquiries(q: ListingQuery<EnquirySort>, f: EnquiryFilters): Promise<Paginated<AdminEnquiryRow>> {
  await requireAdmin();
  const db = await getDb();
  const cond = enquiryWhere(q.search, f);
  const sortCol = { created: enquiries.createdAt, name: enquiries.name, status: enquiries.status }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(enquiryCols)
      .from(enquiries)
      .leftJoin(courses, eq(courses.id, enquiries.courseId))
      .where(cond)
      .orderBy(orderBy(sortCol, q.order), desc(enquiries.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(enquiries).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function exportEnquiries(q: Pick<ListingQuery<EnquirySort>, "search" | "sort" | "order">, f: EnquiryFilters, limit = 5000) {
  const db = await getDb();
  const sortCol = { created: enquiries.createdAt, name: enquiries.name, status: enquiries.status }[q.sort];
  return db
    .select({ ...enquiryCols, phone: enquiries.phone, website: enquiries.website, message: enquiries.message, notes: enquiries.notes, sourcePath: enquiries.sourcePath })
    .from(enquiries)
    .leftJoin(courses, eq(courses.id, enquiries.courseId))
    .where(enquiryWhere(q.search, f))
    .orderBy(orderBy(sortCol, q.order), desc(enquiries.id))
    .limit(limit);
}

export async function getEnquiry(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db
    .select({
      enquiry: enquiries,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(enquiries)
    .leftJoin(courses, eq(courses.id, enquiries.courseId))
    .where(eq(enquiries.id, id))
    .limit(1);
  return row ?? null;
}

export async function courseOptions(): Promise<{ value: string; label: string }[]> {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select({ id: courses.id, title: courses.title }).from(courses).orderBy(asc(courses.sortOrder));
  return rows.map((r) => ({ value: String(r.id), label: r.title }));
}

// ------------------------------------------------------------ subscribers

export const SUBSCRIBER_SORTS = ["created", "email"] as const;
export type SubscriberSort = (typeof SUBSCRIBER_SORTS)[number];

function subscriberWhere(search: string, status?: string): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  if (status === "subscribed" || status === "unsubscribed") where.push(eq(subscribers.status, status));
  where.push(searchAcross(search, [subscribers.email]));
  return and(...where);
}

const subscriberCols = {
  id: subscribers.id,
  email: subscribers.email,
  status: subscribers.status,
  sourcePath: subscribers.sourcePath,
  createdAt: subscribers.createdAt,
  updatedAt: subscribers.updatedAt,
};

export async function listSubscribers(q: ListingQuery<SubscriberSort>, status?: string) {
  await requireAdmin();
  const db = await getDb();
  const cond = subscriberWhere(q.search, status);
  const sortCol = { created: subscribers.createdAt, email: subscribers.email }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db.select(subscriberCols).from(subscribers).where(cond).orderBy(orderBy(sortCol, q.order), desc(subscribers.id)).limit(q.pageSize).offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(subscribers).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function exportSubscribers(q: Pick<ListingQuery<SubscriberSort>, "search" | "sort" | "order">, status?: string, limit = 5000) {
  const db = await getDb();
  const sortCol = { created: subscribers.createdAt, email: subscribers.email }[q.sort];
  return db.select(subscriberCols).from(subscribers).where(subscriberWhere(q.search, status)).orderBy(orderBy(sortCol, q.order), desc(subscribers.id)).limit(limit);
}

// ------------------------------------------------------------ activity

export const ACTIVITY_SORTS = ["created"] as const;
export type ActivitySort = (typeof ACTIVITY_SORTS)[number];

export async function listActivity(q: ListingQuery<ActivitySort>, entityType?: string) {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [searchAcross(q.search, [activityLog.action, activityLog.summary, activityLog.actor])];
  if (entityType) where.push(eq(activityLog.entityType, entityType.slice(0, 40)));
  const cond = and(...where);
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(activityLog).where(cond).orderBy(q.order === "asc" ? asc(activityLog.createdAt) : desc(activityLog.createdAt), desc(activityLog.id)).limit(q.pageSize).offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(activityLog).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function activityEntityTypes(): Promise<string[]> {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.selectDistinct({ t: activityLog.entityType }).from(activityLog).orderBy(asc(activityLog.entityType));
  return rows.map((r) => r.t);
}
