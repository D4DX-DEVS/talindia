"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mediaUpdateSchema, type MediaUpdateInput } from "@/lib/validation/admin";
import { updateMedia } from "../actions";

export function MediaEditForm({ id, defaults }: { id: number; defaults: MediaUpdateInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState, setError } = useForm<MediaUpdateInput>({ resolver: zodResolver(mediaUpdateSchema), defaultValues: defaults });
  const e = formState.errors;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const r = await updateMedia(id, values);
      if (!r.ok) {
        for (const [k, v] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof MediaUpdateInput, { message: v });
        toast.error(r.message);
        return;
      }
      toast.success(r.message);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field id="alt" label="Alt text" error={e.alt?.message} hint="Describe the image for people who cannot see it. Leave empty only for decorative images.">
        <Textarea id="alt" rows={3} {...register("alt")} />
      </Field>
      <Field id="title" label="Title" error={e.title?.message} hint="Internal label, used for searching.">
        <Input id="title" className="h-10" {...register("title")} />
      </Field>
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy. Select the text and copy it manually.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}
