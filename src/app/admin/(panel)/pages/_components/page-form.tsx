"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection, SaveBar, SelectField, STATUS_OPTIONS } from "@/components/admin/fields";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoFields } from "@/components/admin/seo-fields";
import type { PickerItem } from "@/app/admin/(panel)/media/picker-actions";
import { pageSchema, slugify, type PageInput } from "@/lib/validation/admin";
import { savePage } from "../actions";

interface PageFormProps {
  id: number | null;
  defaults: PageInput;
  image: PickerItem | null;
  system: boolean;
}

export function PageForm({ id, defaults, image, system }: PageFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError, setValue, getValues } = useForm<PageInput>({ resolver: zodResolver(pageSchema), defaultValues: defaults });
  const e = formState.errors;
  const slug = useWatch({ control, name: "slug" });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await savePage(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof PageInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!id && result.id) router.replace(`/admin/pages/${result.id}/`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FormSection title="Page">
            <Field id="title" label="Title" required error={e.title?.message}>
              <Input
                id="title"
                className="h-10"
                aria-invalid={!!e.title}
                {...register("title", {
                  onBlur: (ev) => {
                    if (!system && !getValues("slug")) setValue("slug", slugify(ev.target.value), { shouldValidate: true });
                  },
                })}
              />
            </Field>
            <Field
              id="slug"
              label="URL slug"
              required
              error={e.slug?.message}
              hint={system ? "System page: the address is fixed." : `Public URL: /${slug || "…"}/`}
            >
              <Input id="slug" readOnly={system} aria-readonly={system} className="h-10 font-mono text-sm read-only:bg-muted" aria-invalid={!!e.slug} {...register("slug")} />
            </Field>
            <Field id="intro" label="Intro" error={e.intro?.message} hint="Shown large under the page title.">
              <Textarea id="intro" rows={3} {...register("intro")} />
            </Field>
            <Field
              id="body"
              label="Body"
              error={e.body?.message}
              hint="Markdown: blank line between paragraphs, ## for headings, - for lists, [text](https://…) for links. Raw HTML is not allowed."
            >
              <Textarea id="body" rows={14} className="font-mono text-sm" {...register("body")} />
            </Field>
          </FormSection>
          <SeoFields register={register} errors={e} />
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            {system ? (
              <p className="text-sm text-muted-foreground">System pages are always published.</p>
            ) : (
              <SelectField control={control} name="status" id="status" label="Status" options={STATUS_OPTIONS} />
            )}
          </FormSection>
          <FormSection title="Image" description="Used where the page layout shows one, and for social sharing.">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaPicker id="imageId" value={(field.value as number | null) ?? null} initial={image} onChange={(v) => field.onChange(v)} />}
            />
          </FormSection>
        </div>
      </div>
      <SaveBar pending={pending} label={id ? "Save changes" : "Create page"} />
    </form>
  );
}
