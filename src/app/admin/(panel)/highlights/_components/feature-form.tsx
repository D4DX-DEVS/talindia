"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection, IconField, SaveBar, SelectField, STATUS_OPTIONS } from "@/components/admin/fields";
import { featureSchema, type FeatureInput } from "@/lib/validation/admin";
import { saveFeature } from "../actions";

export const GROUP_OPTIONS = [
  { value: "why_choose", label: "Why choose Talindia" },
  { value: "offerings", label: "We offer services" },
];

export function FeatureForm({ id, defaults }: { id: number | null; defaults: FeatureInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError } = useForm<FeatureInput>({ resolver: zodResolver(featureSchema), defaultValues: defaults });
  const e = formState.errors;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveFeature(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof FeatureInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!id && result.id) router.replace(`/admin/highlights/${result.id}/`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FormSection title="Highlight">
            <Field id="title" label="Title" required error={e.title?.message}>
              <Input id="title" className="h-10" aria-invalid={!!e.title} {...register("title")} />
            </Field>
            <Field id="description" label="Description" error={e.description?.message}>
              <Textarea id="description" rows={3} {...register("description")} />
            </Field>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Placement">
            <SelectField control={control} name="group" id="group" label="Section" options={GROUP_OPTIONS} />
            <SelectField control={control} name="status" id="status" label="Status" options={STATUS_OPTIONS} />
            <Field id="sortOrder" label="Order" error={e.sortOrder?.message} hint="Lower numbers appear first.">
              <Input id="sortOrder" type="number" min={0} className="h-10" {...register("sortOrder")} />
            </Field>
            <IconField control={control} name="icon" id="icon" label="Icon" error={e.icon?.message} />
          </FormSection>
        </div>
      </div>
      <SaveBar pending={pending} label={id ? "Save changes" : "Create highlight"} />
    </form>
  );
}
