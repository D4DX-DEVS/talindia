import { z } from "zod";

/** Shared by the client forms (react-hook-form) and the server actions. */

export const ENQUIRY_SUBJECTS = {
  general: "General enquiry",
  training: "Training enquiry",
  mentor: "Find a mentor",
  webinar: "Free webinar",
  corporate: "Corporate training",
  placement: "Job placement assistance",
} as const;
export type EnquirySubject = keyof typeof ENQUIRY_SUBJECTS;
export const ENQUIRY_SUBJECT_KEYS = Object.keys(ENQUIRY_SUBJECTS) as [EnquirySubject, ...EnquirySubject[]];

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v), "Enter a valid website address")
  .optional()
  .default("");

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email address").trim().max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^\+?[0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number")
    .optional()
    .default(""),
  website: optionalUrl,
  subject: z.enum(ENQUIRY_SUBJECT_KEYS).default("general"),
  courseSlug: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000, "Keep it under 2000 characters"),
  /** Honeypot: real visitors never see or fill it. */
  company: z.string().max(0).optional().default(""),
});
export type EnquiryInput = z.input<typeof enquirySchema>;

export const subscribeSchema = z.object({
  email: z.email("Please enter a valid email address").trim().max(200),
  company: z.string().max(0).optional().default(""),
});
export type SubscribeInput = z.input<typeof subscribeSchema>;

export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
