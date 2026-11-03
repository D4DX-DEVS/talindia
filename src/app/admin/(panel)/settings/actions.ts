"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { invalidate, type ActionResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { SETTINGS_KEYS, settingsSchemas, type SettingsKey } from "@/lib/settings-schema";
import { fieldErrorsOf } from "@/lib/validation/forms";

export async function saveSetting(key: SettingsKey, value: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!SETTINGS_KEYS.includes(key)) return { ok: false, message: "Unknown setting." };
  const parsed = settingsSchemas[key].safeParse(value);
  if (!parsed.success) {
    // Nested paths (e.g. social.0.url) are flattened to their first segment by fieldErrorsOf; keep full paths here.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { ...fieldErrorsOf(parsed.error), ...fieldErrors } };
  }
  try {
    const db = await getDb();
    const now = new Date();
    await db
      .insert(settings)
      .values({ key, value: parsed.data, updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data, updatedAt: now } });
    const [check] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, key)).limit(1);
    if (!check) return { ok: false, message: "Saving failed. Please try again." };
    invalidate(TAGS.settings);
    await logActivity({ actor: session.email, action: "settings.update", entityType: "setting", entityId: key, summary: `Updated ${key}` });
    return { ok: true, message: "Settings saved." };
  } catch {
    return { ok: false, message: "Saving failed. Please try again." };
  }
}
