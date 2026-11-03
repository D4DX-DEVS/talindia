"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscribe } from "@/app/(site)/actions";
import { subscribeSchema, type SubscribeInput } from "@/lib/validation/forms";

export function NewsletterForm() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState, reset, setError } = useForm<SubscribeInput>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: "", company: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await subscribe(values, pathname);
      if (result.ok) {
        toast.success(result.message);
        reset();
      } else {
        setError("email", { message: result.fieldErrors?.email ?? result.message });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <label htmlFor="newsletter-email" className="block text-base font-semibold text-on-dark">
        Get course launch updates
      </label>
      <div className="flex">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          aria-invalid={!!formState.errors.email}
          aria-describedby={formState.errors.email ? "newsletter-error" : undefined}
          className="h-12 min-w-0 flex-1 bg-night-soft px-4 text-base text-on-dark placeholder:text-on-dark-soft focus-visible:outline-violet"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-violet text-white transition-colors hover:bg-white hover:text-ink disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
        </button>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("company")} />
      {formState.errors.email && (
        <p id="newsletter-error" role="alert" className="text-sm font-medium text-violet-pale">
          {formState.errors.email.message}
        </p>
      )}
    </form>
  );
}
