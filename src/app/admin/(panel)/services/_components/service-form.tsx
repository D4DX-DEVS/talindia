"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection, IconField, LinesField, SaveBar, SelectField, STATUS_OPTIONS } from "@/components/admin/fields";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoFields } from "@/components/admin/seo-fields";
import type { PickerItem } from "@/app/admin/(panel)/media/picker-actions";
import { serviceSchema, slugify, type ServiceInput } from "@/lib/validation/admin";
import { saveService } from "../actions";

interface ServiceFormProps {
  id: number | null;
  defaults: ServiceInput;
  image: PickerItem | null;
}

export function ServiceForm({ id, defaults, image }: ServiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError, setValue, getValues } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaults,
  });
  const e = formState.errors;
  const [slug, summary, highlights] = useWatch({ control, name: ["slug", "summary", "highlights"] });
  const hasPage = Boolean(summary?.trim()) || (highlights?.length ?? 0) > 0;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveService(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof ServiceInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!id && result.id) router.replace(`/admin/services/${result.id}/`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FormSection title="Service">
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
            <Field
              id="slug"
              label="URL slug"
              required
              error={e.slug?.message}
              hint={hasPage ? `Public URL: /all-service/${slug || "…"}/` : "No public page yet: add a summary or highlights to publish /all-service/<slug>/."}
            >
              <Input id="slug" className="h-10 font-mono text-sm" aria-invalid={!!e.slug} {...register("slug")} />
            </Field>
            <Field id="summary" label="Summary" error={e.summary?.message}>
              <Textarea id="summary" rows={2} {...register("summary")} />
            </Field>
            <LinesField control={control} name="highlights" id="highlights" label="What it includes" error={e.highlights?.message} />
          </FormSection>
          <SeoFields register={register} errors={e} />
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SelectField control={control} name="status" id="status" label="Status" options={STATUS_OPTIONS} />
            <Field id="sortOrder" label="Order" error={e.sortOrder?.message} hint="Lower numbers appear first.">
              <Input id="sortOrder" type="number" min={0} className="h-10" {...register("sortOrder")} />
            </Field>
            <IconField control={control} name="icon" id="icon" label="Icon" error={e.icon?.message} />
          </FormSection>
          <FormSection title="Image" description="Shown on the home page service sheet and the service page.">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaPicker id="imageId" value={(field.value as number | null) ?? null} initial={image} onChange={(v) => field.onChange(v)} />}
            />
          </FormSection>
        </div>
      </div>
      <SaveBar pending={pending} label={id ? "Save changes" : "Create service"} />
    </form>
  );
}
