"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pages } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, UserError, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { idSchema, pageSchema, type PageInput } from "@/lib/validation/admin";

/** Slugs owned by real routes; a custom page with one of these would never be reachable. */
const RESERVED = new Set(["home", "about-us", "contact", "trainings", "courses", "all-service", "admin", "media", "api", "sitemap.xml", "robots.txt"]);

export async function savePage(id: number | null, input: PageInput): Promise<SavedResult> {
  return adminMutation(pageSchema, input, async (data, session) => {
    const db = await getDb();
    const base = { ...data, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, updatedAt: new Date() };
    let savedId: number;
    let previousSlug: string | null = null;
    if (id) {
      const [prev] = await db.select({ slug: pages.slug, system: pages.system }).from(pages).where(eq(pages.id, id)).limit(1);
      if (!prev) return { ok: false, message: "This page no longer exists." };
      previousSlug = prev.slug;
      if (prev.system) {
        // System pages keep their slug and stay published: their routes are hard-wired.
        await db.update(pages).set({ ...base, slug: prev.slug, status: "published" }).where(eq(pages.id, id));
      } else {
        if (RESERVED.has(data.slug)) throw new UserError(`“${data.slug}” is reserved by the website. Choose another slug.`);
        await db.update(pages).set(base).where(eq(pages.id, id));
      }
      savedId = id;
    } else {
      if (RESERVED.has(data.slug)) throw new UserError(`“${data.slug}” is reserved by the website. Choose another slug.`);
      const [row] = await db.insert(pages).values({ ...base, system: false }).returning({ id: pages.id });
      savedId = row.id;
    }
    invalidate(TAGS.pages, TAGS.page(previousSlug ?? data.slug), TAGS.page(data.slug));
    await logActivity({ actor: session.email, action: id ? "page.update" : "page.create", entityType: "page", entityId: savedId, summary: data.title });
    return { ok: true, message: id ? "Page saved." : "Page created.", id: savedId };
  });
}

export async function deletePage(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ title: pages.title, slug: pages.slug, system: pages.system }).from(pages).where(eq(pages.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This page no longer exists." };
  if (row.system) return { ok: false, message: "System pages cannot be deleted." };
  await db.delete(pages).where(eq(pages.id, parsed.data));
  invalidate(TAGS.pages, TAGS.page(row.slug));
  await logActivity({ actor: session.email, action: "page.delete", entityType: "page", entityId: parsed.data, summary: row.title });
  return { ok: true, message: `Deleted “${row.title}”.` };
}
