import { Suspense } from "react";
import { inArray } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { getDb } from "@/db/client";
import { media, settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { SETTINGS_KEYS, settingsSchemas, type Settings } from "@/lib/settings-schema";
import type { PickerItem } from "../media/picker-actions";
import { SETTING_SECTIONS } from "./_components/settings-config";
import { SettingsSectionForm, SocialLinksForm } from "./_components/settings-form";

async function loadSettings(): Promise<{ values: Partial<Settings>; invalid: string[]; images: Record<string, PickerItem | null> }> {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const values: Partial<Record<keyof Settings, unknown>> = {};
  const invalid: string[] = [];
  for (const key of SETTINGS_KEYS) {
    const parsed = settingsSchemas[key].safeParse(map.get(key));
    if (parsed.success) values[key] = parsed.data;
    else invalid.push(key);
  }
  const v = values as Partial<Settings>;
  const keys = [v.hero?.imageKey, v.homeAbout?.imageKey, v.seo?.ogImageKey].filter((k): k is string => Boolean(k));
  const found = keys.length
    ? await db
        .select({ id: media.id, key: media.key, filename: media.filename, alt: media.alt, width: media.width, height: media.height, mimeType: media.mimeType })
        .from(media)
        .where(inArray(media.key, keys))
    : [];
  const images = Object.fromEntries(found.map((m) => [m.key, m]));
  return { values: v, invalid, images };
}

async function SettingsForms() {
  const { values, invalid, images } = await loadSettings();
  return (
    <div className="space-y-6">
      {invalid.length > 0 && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          These settings are missing or invalid and use empty defaults below: {invalid.join(", ")}. Saving the section fixes them.
        </p>
      )}
      <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
        {[...SETTING_SECTIONS.map((s) => ({ key: s.key, title: s.title })), { key: "social", title: "Social links" }].map((s) => (
          <a key={s.key} href={`#${s.key}`} className="inline-flex min-h-9 items-center rounded-md border bg-card px-3 text-sm hover:bg-muted">{s.title}</a>
        ))}
      </nav>
      {SETTING_SECTIONS.map((section) => (
        <SettingsSectionForm
          key={section.key}
          section={section}
          defaults={(values[section.key] as Record<string, unknown> | undefined) ?? Object.fromEntries(section.fields.map((f) => [f.name, f.kind === "switch" ? false : ""]))}
          images={images}
        />
      ))}
      <SocialLinksForm defaults={values.social ?? []} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader title="Site & SEO settings" description="Contact details, home page copy and search defaults. Changes appear on the website immediately." />
      <Suspense fallback={<FormSkeleton />}>
        <SettingsForms />
      </Suspense>
    </>
  );
}
