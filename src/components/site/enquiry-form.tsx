"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitEnquiry } from "@/app/(site)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENQUIRY_SUBJECTS, enquirySchema, type EnquiryInput, type EnquirySubject } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

interface EnquiryFormProps {
  defaultSubject?: EnquirySubject;
  courseSlug?: string;
  courseTitle?: string;
  tone?: "light" | "dark";
}

const field = "h-12 rounded-none border-0 bg-paper px-4 text-base text-ink shadow-none ring-1 ring-ink/15 focus-visible:ring-2 focus-visible:ring-violet";

export function EnquiryForm({ defaultSubject = "general", courseSlug, courseTitle, tone = "light" }: EnquiryFormProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const form = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      message: "",
      company: "",
      subject: courseSlug ? "training" : defaultSubject,
      courseSlug: courseSlug ?? "",
    },
  });
  const { register, handleSubmit, formState, setError, reset, control } = form;
  const errors = formState.errors;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await submitEnquiry(values, pathname);
      if (result.ok) {
        toast.success(result.message);
        reset({ ...values, name: "", email: "", phone: "", website: "", message: "" });
        return;
      }
      for (const [k, v] of Object.entries(result.fieldErrors ?? {})) setError(k as keyof EnquiryInput, { message: v });
      toast.error(result.message);
    }),
  );

  const labelCls = cn("text-sm font-semibold", tone === "dark" ? "text-on-dark" : "text-ink");
  const errorCls = cn("text-sm font-medium", tone === "dark" ? "text-violet-pale" : "text-destructive");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby="enquiry-note">
      {courseTitle && (
        <p className={cn("flex items-center gap-2 text-base font-semibold", tone === "dark" ? "text-on-dark" : "text-ink")}>
          <CheckCircle2 className="size-5 text-violet" aria-hidden /> Enquiring about: {courseTitle}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="enq-name" className={labelCls}>Name *</Label>
          <Input id="enq-name" autoComplete="name" className={field} aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className={errorCls}>{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="enq-email" className={labelCls}>Email *</Label>
          <Input id="enq-email" type="email" autoComplete="email" inputMode="email" className={field} aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className={errorCls}>{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="enq-phone" className={labelCls}>Phone</Label>
          <Input id="enq-phone" type="tel" autoComplete="tel" inputMode="tel" className={field} aria-invalid={!!errors.phone} {...register("phone")} />
          {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="enq-website" className={labelCls}>Website address</Label>
          <Input id="enq-website" autoComplete="url" inputMode="url" className={field} aria-invalid={!!errors.website} {...register("website")} />
          {errors.website && <p className={errorCls}>{errors.website.message}</p>}
        </div>
      </div>
      {!courseSlug && (
        <div className="space-y-2">
          <Label htmlFor="enq-subject" className={labelCls}>What is it about?</Label>
          <Controller
            control={control}
            name="subject"
            render={({ field: f }) => (
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger id="enq-subject" className={cn(field, "w-full data-[size=default]:h-12")}>
                  <SelectValue>{ENQUIRY_SUBJECTS[f.value as EnquirySubject]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {Object.entries(ENQUIRY_SUBJECTS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="min-h-10">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="enq-message" className={labelCls}>Your message *</Label>
        <Textarea id="enq-message" rows={6} className={cn(field, "h-auto min-h-36 py-3")} aria-invalid={!!errors.message} {...register("message")} />
        {errors.message && <p className={errorCls}>{errors.message.message}</p>}
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="enq-company">Leave this field empty</label>
        <input id="enq-company" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id="enquiry-note" className={cn("text-sm", tone === "dark" ? "text-on-dark-soft" : "text-soft")}>
          We use your details only to reply to this message.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center gap-2 bg-violet px-7 text-base font-bold text-white transition-colors hover:bg-indigo disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
