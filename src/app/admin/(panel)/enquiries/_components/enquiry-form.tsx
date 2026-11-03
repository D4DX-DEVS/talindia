"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FormSection, SaveBar, SelectField } from "@/components/admin/fields";
import { Textarea } from "@/components/ui/textarea";
import { enquiryUpdateSchema, type EnquiryUpdateInput } from "@/lib/validation/admin";
import { updateEnquiry } from "../actions";
import { ENQUIRY_STATUS_OPTIONS } from "./enquiry-status";

export function EnquiryUpdateForm({ id, defaults }: { id: number; defaults: EnquiryUpdateInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState, setError } = useForm<EnquiryUpdateInput>({
    resolver: zodResolver(enquiryUpdateSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateEnquiry(id, values);
      if (!result.ok) {
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof EnquiryUpdateInput, { message: v });
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormSection title="Follow-up" description="Internal only; never shown to the sender.">
        <SelectField control={control} name="status" id="status" label="Status" options={ENQUIRY_STATUS_OPTIONS} error={formState.errors.status?.message} />
        <Field id="notes" label="Internal notes" error={formState.errors.notes?.message}>
          <Textarea id="notes" rows={6} aria-invalid={!!formState.errors.notes} {...register("notes")} />
        </Field>
      </FormSection>
      <SaveBar pending={pending} inline />
    </form>
  );
}
