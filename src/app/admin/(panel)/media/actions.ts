"use server";

import { eq } from "drizzle-orm";
import { getDb, getEnv } from "@/db/client";
import { media } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, type ActionResult } from "@/lib/admin/guard";
import { mediaUsage } from "@/lib/admin/media-queries";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { toHex } from "@/lib/security";
import { checkUpload, MAX_UPLOAD_BYTES, safeBaseName } from "@/lib/upload-validation";
import { idSchema, mediaUpdateSchema, type MediaUpdateInput } from "@/lib/validation/admin";

export interface UploadOutcome {
  name: string;
  ok: boolean;
  message: string;
  id?: number;
}

const MAX_FILES = 20;

async function freeKey(base: string, ext: string): Promise<string> {
  const now = new Date();
  const dir = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = attempt === 0 ? "" : `-${toHex(crypto.getRandomValues(new Uint8Array(3)).buffer)}`;
    const key = `${dir}/${base}${suffix}.${ext}`;
    const [hit] = await db.select({ id: media.id }).from(media).where(eq(media.key, key)).limit(1);
    if (!hit) return key;
  }
  throw new Error("Could not allocate a unique key");
}

/** One file per call keeps each request under the server-action body limit and gives per-file status. */
export async function uploadMedia(formData: FormData): Promise<UploadOutcome[]> {
  const session = await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File).slice(0, MAX_FILES);
  if (!files.length) return [{ name: "", ok: false, message: "No file received." }];
  const env = await getEnv();
  const db = await getDb();
  const out: UploadOutcome[] = [];
  for (const file of files) {
    const name = file.name.slice(0, 200) || "file";
    if (file.size > MAX_UPLOAD_BYTES) {
      out.push({ name, ok: false, message: "Larger than 10 MB." });
      continue;
    }
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const check = checkUpload(buf, buf.byteLength);
      if (!check.ok) {
        out.push({ name, ok: false, message: check.reason });
        continue;
      }
      const key = await freeKey(safeBaseName(name), check.ext);
      const sha256 = toHex(await crypto.subtle.digest("SHA-256", buf));
      await env.MEDIA.put(key, buf, {
        httpMetadata: { contentType: check.type, cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { sha256, uploadedBy: session.email },
      });
      const [row] = await db
        .insert(media)
        .values({
          key,
          filename: key.split("/").pop() ?? name,
          mimeType: check.type,
          size: buf.byteLength,
          width: check.dimensions?.width ?? null,
          height: check.dimensions?.height ?? null,
          title: name.replace(/\.[^.]*$/, "").slice(0, 200),
          sha256,
          uploadedBy: session.email,
        })
        .returning({ id: media.id });
      await logActivity({ actor: session.email, action: "media.upload", entityType: "media", entityId: row.id, summary: key });
      out.push({ name, ok: true, message: "Uploaded", id: row.id });
    } catch {
      out.push({ name, ok: false, message: "Upload failed. Please try again." });
    }
  }
  if (out.some((o) => o.ok)) invalidate(TAGS.media);
  return out;
}

export async function updateMedia(id: number, input: MediaUpdateInput): Promise<ActionResult> {
  return adminMutation(mediaUpdateSchema, input, async (data, session) => {
    const parsedId = idSchema.parse(id);
    const db = await getDb();
    const [row] = await db.select({ key: media.key }).from(media).where(eq(media.id, parsedId)).limit(1);
    if (!row) return { ok: false, message: "This file no longer exists." };
    await db.update(media).set({ alt: data.alt, title: data.title, updatedAt: new Date() }).where(eq(media.id, parsedId));
    // Alt text is rendered wherever the image appears.
    const usage = await mediaUsage(parsedId, row.key);
    invalidate(TAGS.media, ...usage.map((u) => u.tag));
    await logActivity({ actor: session.email, action: "media.update", entityType: "media", entityId: parsedId, summary: row.key });
    return { ok: true, message: "File details saved." };
  });
}

export async function deleteMedia(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ key: media.key }).from(media).where(eq(media.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This file no longer exists." };
  const usage = await mediaUsage(parsed.data, row.key);
  if (usage.length) {
    return { ok: false, message: `Still in use — ${usage.map((u) => u.label).join("; ")}. Replace it there first.` };
  }
  const env = await getEnv();
  await env.MEDIA.delete(row.key);
  await db.delete(media).where(eq(media.id, parsed.data));
  invalidate(TAGS.media);
  await logActivity({ actor: session.email, action: "media.delete", entityType: "media", entityId: parsed.data, summary: row.key });
  return { ok: true, message: `Deleted ${row.key.split("/").pop()}.` };
}
