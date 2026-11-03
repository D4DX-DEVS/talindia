"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ICON_NAMES, CmsIcon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Visible label, the control, then hint or inline error. */
export function Field({ id, label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface ControlledProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

/** string[] edited as one item per line. */
export function LinesField<T extends FieldValues>({ control, name, id, label, error, hint, rows = 5 }: ControlledProps<T> & { rows?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field id={id} label={label} error={error} hint={hint ?? "One item per line."}>
          <Textarea
            id={id}
            rows={rows}
            value={(field.value as string[] | undefined)?.join("\n") ?? ""}
            onChange={(e) => field.onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
            onBlur={field.onBlur}
            aria-invalid={!!error}
          />
        </Field>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  error,
  hint,
  required,
  options,
}: ControlledProps<T> & { options: { value: string; label: string }[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field id={id} label={label} error={error} hint={hint} required={required}>
          <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
            <SelectTrigger id={id} className="h-10 w-full data-[size=default]:h-10" aria-invalid={!!error}>
              <SelectValue>{options.find((o) => o.value === String(field.value ?? ""))?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  );
}

export const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft (hidden from the website)" },
];

export function IconField<T extends FieldValues>(props: ControlledProps<T>) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <Field id={props.id} label={props.label} error={props.error} hint={props.hint}>
          <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
            <SelectTrigger id={props.id} className="h-10 w-full data-[size=default]:h-10">
              <SelectValue>{String(field.value ?? "")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ICON_NAMES.map((n) => (
                <SelectItem key={n} value={n}>
                  <CmsIcon name={n} className="size-4" /> {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  );
}

interface SaveBarProps {
  pending: boolean;
  label?: string;
  children?: React.ReactNode;
  /** Inside a column (e.g. a sidebar card) instead of spanning the page. */
  inline?: boolean;
}

export function SaveBar({ pending, label = "Save changes", children, inline }: SaveBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        inline ? "pt-2" : "sticky bottom-0 -mx-4 border-t bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
      )}
    >
      {children}
      <Button type="submit" disabled={pending} className="h-10 min-w-32">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
