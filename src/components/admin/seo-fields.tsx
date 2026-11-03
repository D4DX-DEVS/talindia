"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "./fields";

interface SeoFieldsProps<T extends FieldValues & { seoTitle?: string; seoDescription?: string }> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}

export function SeoFields<T extends FieldValues & { seoTitle?: string; seoDescription?: string }>({ register, errors }: SeoFieldsProps<T>) {
  const e = errors as FieldErrors<{ seoTitle: string; seoDescription: string }>;
  return (
    <FormSection title="Search engines" description="Leave empty to use the title and a summary automatically.">
      <Field id="seoTitle" label="SEO title" error={e.seoTitle?.message} hint="Up to about 60 characters. The site name is appended.">
        <Input id="seoTitle" className="h-10" {...register("seoTitle" as Path<T>)} />
      </Field>
      <Field id="seoDescription" label="Meta description" error={e.seoDescription?.message} hint="Up to about 155 characters.">
        <Textarea id="seoDescription" rows={3} {...register("seoDescription" as Path<T>)} />
      </Field>
    </FormSection>
  );
}
