"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection, LinesField, SaveBar, SelectField, STATUS_OPTIONS } from "@/components/admin/fields";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoFields } from "@/components/admin/seo-fields";
import type { PickerItem } from "@/app/admin/(panel)/media/picker-actions";
import { courseSchema, slugify, type CourseInput } from "@/lib/validation/admin";
import { saveCourse } from "../actions";

const AVAILABILITY = [
  { value: "coming_soon", label: "Coming soon" },
  { value: "open", label: "Enrolling" },
  { value: "closed", label: "Closed" },
];

interface CourseFormProps {
  id: number | null;
  defaults: CourseInput;
  image: PickerItem | null;
}

export function CourseForm({ id, defaults, image }: CourseFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<CourseInput>({ resolver: zodResolver(courseSchema), defaultValues: defaults });
  const { register, control, handleSubmit, formState, setError, setValue, getValues } = form;
  const e = formState.errors;
  const slug = useWatch({ control, name: "slug" });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveCourse(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof CourseInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!id && result.id) router.replace(`/admin/courses/${result.id}/`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FormSection title="Training">
            <Field id="title" label="Title" required error={e.title?.message}>
              <Input
                id="title"
                className="h-10"
                aria-invalid={!!e.title}
                {...register("title", {
                  onBlur: (ev) => {
                    if (!getValues("slug")) setValue("slug", slugify(ev.target.value), { shouldValidate: true });
                  },
                })}
              />
            </Field>
            <Field id="slug" label="URL slug" required error={e.slug?.message} hint={`Public URL: /courses/${slug || "…"}/`}>
              <Input id="slug" className="h-10 font-mono text-sm" aria-invalid={!!e.slug} {...register("slug")} />
            </Field>
            <Field id="audience" label="Who it is for" required error={e.audience?.message}>
              <Textarea id="audience" rows={2} aria-invalid={!!e.audience} {...register("audience")} />
            </Field>
            <LinesField control={control} name="highlights" id="highlights" label="What it covers" error={e.highlights?.message} />
            <Field id="marketGap" label="Market gap" error={e.marketGap?.message} hint="Optional. Shown as “Why now” on the training page.">
              <Textarea id="marketGap" rows={2} {...register("marketGap")} />
            </Field>
          </FormSection>
          <SeoFields register={register} errors={e} />
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SelectField control={control} name="status" id="status" label="Status" options={STATUS_OPTIONS} />
            <SelectField control={control} name="availability" id="availability" label="Enrolment" options={AVAILABILITY} />
            <Field id="sortOrder" label="Order" error={e.sortOrder?.message} hint="Lower numbers appear first.">
              <Input id="sortOrder" type="number" min={0} className="h-10" {...register("sortOrder")} />
            </Field>
            <Field id="category" label="Category" error={e.category?.message} hint="Optional, searchable.">
              <Input id="category" className="h-10" {...register("category")} />
            </Field>
          </FormSection>
          <FormSection title="Image">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => (
                <MediaPicker id="imageId" value={(field.value as number | null) ?? null} initial={image} onChange={(v) => field.onChange(v)} />
              )}
            />
          </FormSection>
        </div>
      </div>
      <SaveBar pending={pending} label={id ? "Save changes" : "Create training"} />
    </form>
  );
}
