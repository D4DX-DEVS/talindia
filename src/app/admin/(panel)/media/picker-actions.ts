"use server";

import { and, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { likePattern } from "@/lib/listing";

export interface PickerItem {
  id: number;
  key: string;
  filename: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
}

export interface PickerPage {
  items: PickerItem[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 24;

/** Image search for the media picker dialog (paginated, never the whole library). */
export async function pickerMedia(search: string, page: number): Promise<PickerPage> {
  await requireAdmin();
  const db = await getDb();
  const p = Math.max(1, Math.floor(page) || 1);
  const where: SQL[] = [like(media.mimeType, "image/%")];
  const term = search.trim().slice(0, 100);
  if (term) {
    const pattern = likePattern(term);
    const m = or(sql`${media.filename} LIKE ${pattern} ESCAPE '\\'`, sql`${media.alt} LIKE ${pattern} ESCAPE '\\'`, sql`${media.title} LIKE ${pattern} ESCAPE '\\'`);
    if (m) where.push(m);
  }
  const cond = and(...where);
  const [items, [{ total }]] = await Promise.all([
    db
      .select({ id: media.id, key: media.key, filename: media.filename, alt: media.alt, width: media.width, height: media.height, mimeType: media.mimeType })
      .from(media)
      .where(cond)
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(PAGE_SIZE)
      .offset((p - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(media).where(cond),
  ]);
  return { items, total, page: p, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function pickerMediaById(id: number): Promise<PickerItem | null> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db
    .select({ id: media.id, key: media.key, filename: media.filename, alt: media.alt, width: media.width, height: media.height, mimeType: media.mimeType })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return row ?? null;
}
