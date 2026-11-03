"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection, SaveBar, SelectField, STATUS_OPTIONS } from "@/components/admin/fields";
import { testimonialSchema, type TestimonialInput } from "@/lib/validation/admin";
import { saveTestimonial } from "../actions";

export function TestimonialForm({ id, defaults }: { id: number | null; defaults: TestimonialInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError } = useForm<TestimonialInput>({ resolver: zodResolver(testimonialSchema), defaultValues: defaults });
  const e = formState.errors;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveTestimonial(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof TestimonialInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!id && result.id) router.replace(`/admin/testimonials/${result.id}/`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <FormSection title="Testimonial" description="Only publish quotes the person has agreed to share.">
            <Field id="quote" label="Quote" required error={e.quote?.message}>
              <Textarea id="quote" rows={5} aria-invalid={!!e.quote} {...register("quote")} />
            </Field>
            <Field id="name" label="Name" required error={e.name?.message}>
              <Input id="name" className="h-10" aria-invalid={!!e.name} {...register("name")} />
            </Field>
            <Field id="role" label="Role" error={e.role?.message} hint="e.g. Data Analyst">
              <Input id="role" className="h-10" {...register("role")} />
            </Field>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SelectField control={control} name="status" id="status" label="Status" options={STATUS_OPTIONS} />
            <Field id="sortOrder" label="Order" error={e.sortOrder?.message} hint="The first published testimonial is shown largest.">
              <Input id="sortOrder" type="number" min={0} className="h-10" {...register("sortOrder")} />
            </Field>
          </FormSection>
        </div>
      </div>
      <SaveBar pending={pending} label={id ? "Save changes" : "Create testimonial"} />
    </form>
  );
}
