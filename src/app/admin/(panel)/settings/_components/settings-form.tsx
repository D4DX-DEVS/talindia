"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, FormSection } from "@/components/admin/fields";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PickerItem } from "@/app/admin/(panel)/media/picker-actions";
import { settingsSchemas, type Settings } from "@/lib/settings-schema";
import { saveSetting } from "../actions";
import type { SettingSection } from "./settings-config";

function errorAt(errors: Record<string, unknown>, path: string): string | undefined {
  const node = path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), errors);
  const msg = node && typeof node === "object" ? (node as { message?: unknown }).message : undefined;
  return typeof msg === "string" ? msg : undefined;
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending} className="h-10 min-w-28">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

interface SectionFormProps {
  section: SettingSection;
  defaults: Record<string, unknown>;
  images: Record<string, PickerItem | null>;
}

export function SettingsSectionForm({ section, defaults, images }: SectionFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FieldValues>({
    resolver: zodResolver(settingsSchemas[section.key]) as unknown as Resolver<FieldValues>,
    defaultValues: defaults,
  });
  const { register, control, handleSubmit, formState, setError } = form;
  const errors = formState.errors as Record<string, unknown>;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const r = await saveSetting(section.key, values);
      if (!r.ok) {
        for (const [k, v] of Object.entries(r.fieldErrors ?? {})) setError(k, { message: v });
        toast.error(r.message);
        return;
      }
      toast.success(`${section.title}: saved.`);
      router.refresh();
    }),
  );

  return (
    <form id={section.key} onSubmit={onSubmit} noValidate className="scroll-mt-20">
      <FormSection title={section.title} description={section.description}>
        <div className="grid gap-4 md:grid-cols-2">
          {section.fields.map((f) => {
            const id = `${section.key}-${f.name}`;
            const error = errorAt(errors, f.name);
            const wide = f.kind === "textarea" || f.kind === "image";
            if (f.kind === "switch") {
              return (
                <Controller
                  key={f.name}
                  control={control}
                  name={f.name}
                  render={({ field }) => (
                    <div className="flex min-h-10 items-center gap-3 md:col-span-2">
                      <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      <label htmlFor={id} className="text-sm font-medium">{f.label}</label>
                    </div>
                  )}
                />
              );
            }
            if (f.kind === "image") {
              return (
                <Controller
                  key={f.name}
                  control={control}
                  name={f.name}
                  render={({ field }) => (
                    <Field id={id} label={f.label} error={error} hint={f.hint} className="md:col-span-2">
                      <Input id={id} className="h-10 font-mono text-sm" value={String(field.value ?? "")} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={!!error} />
                      <div className="pt-2">
                        <MediaPicker
                          id={`${id}-picker`}
                          value={images[String(field.value ?? "")]?.id ?? null}
                          initial={images[String(field.value ?? "")] ?? null}
                          onChange={(_, item) => field.onChange(item?.key ?? "")}
                        />
                      </div>
                    </Field>
                  )}
                />
              );
            }
            return (
              <Field key={f.name} id={id} label={f.label} error={error} hint={f.hint} required={f.required} className={wide ? "md:col-span-2" : undefined}>
                {f.kind === "textarea" ? (
                  <Textarea id={id} rows={3} aria-invalid={!!error} {...register(f.name)} />
                ) : (
                  <Input id={id} type={f.kind === "email" ? "email" : "text"} className="h-10" aria-invalid={!!error} {...register(f.name)} />
                )}
              </Field>
            );
          })}
        </div>
        <SaveButton pending={pending} />
      </FormSection>
    </form>
  );
}

interface SocialFormValues {
  links: Settings["social"];
}

export function SocialLinksForm({ defaults }: { defaults: Settings["social"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError } = useForm<SocialFormValues>({ defaultValues: { links: defaults } });
  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  const errors = formState.errors as Record<string, unknown>;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const parsed = settingsSchemas.social.safeParse(values.links);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) setError(`links.${issue.path.join(".")}` as `links.${number}.url`, { message: issue.message });
        toast.error("Please fix the highlighted links.");
        return;
      }
      const r = await saveSetting("social", parsed.data);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Social links saved.");
      router.refresh();
    }),
  );

  return (
    <form id="social" onSubmit={onSubmit} noValidate className="scroll-mt-20">
      <FormSection title="Social links" description="Shown in the footer and in search-engine structured data. Leave empty to hide.">
        {fields.length === 0 && <p className="text-sm text-muted-foreground">No social links yet.</p>}
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.id} className="grid items-end gap-3 sm:grid-cols-[180px_1fr_auto]">
              <Field id={`social-${i}-label`} label="Label" error={errorAt(errors, `links.${i}.label`)}>
                <Input id={`social-${i}-label`} className="h-10" placeholder="LinkedIn" {...register(`links.${i}.label`)} />
              </Field>
              <Field id={`social-${i}-url`} label="URL" error={errorAt(errors, `links.${i}.url`)}>
                <Input id={`social-${i}-url`} className="h-10" placeholder="https://" inputMode="url" {...register(`links.${i}.url`)} />
              </Field>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove link ${i + 1}`} className="mb-0.5 text-destructive" onClick={() => remove(i)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" className="h-10" disabled={fields.length >= 10} onClick={() => append({ label: "", url: "" })}>
            <Plus aria-hidden /> Add link
          </Button>
          <SaveButton pending={pending} />
        </div>
      </FormSection>
    </form>
  );
}
