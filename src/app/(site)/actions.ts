"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, enquiries, subscribers } from "@/db/schema";
import { hashIp, rateLimit, requestMeta } from "@/lib/security";
import {
  ENQUIRY_SUBJECTS,
  enquirySchema,
  fieldErrorsOf,
  subscribeSchema,
  type ActionResult,
  type EnquiryInput,
  type SubscribeInput,
} from "@/lib/validation/forms";

const GENERIC_ERROR = "Something went wrong on our side. Please try again, or email us directly.";

export async function submitEnquiry(input: EnquiryInput, sourcePath: string): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  const data = parsed.data;
  // Honeypot filled: pretend success so bots learn nothing.
  if (data.company) return { ok: true, message: "Thank you. We will get back to you shortly." };

  try {
    const meta = await requestMeta();
    const ipHash = await hashIp(meta.ip);
    const limit = await rateLimit("enquiry", ipHash, 5, 60 * 60);
    if (!limit.allowed) {
      return { ok: false, message: `Too many messages from this connection. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` };
    }
    const db = await getDb();
    let courseId: number | null = null;
    let subject: string = ENQUIRY_SUBJECTS[data.subject];
    if (data.courseSlug) {
      const [course] = await db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.slug, data.courseSlug)).limit(1);
      if (course) {
        courseId = course.id;
        subject = `${ENQUIRY_SUBJECTS.training}: ${course.title}`;
      }
    }
    await db.insert(enquiries).values({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      website: data.website || null,
      subject,
      message: data.message,
      courseId,
      sourcePath: sourcePath.slice(0, 200),
      ipHash,
      userAgent: meta.userAgent,
    });
    return { ok: true, message: "Thank you. Your message has reached the Talindia team and we will get back to you shortly." };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

export async function subscribe(input: SubscribeInput, sourcePath: string): Promise<ActionResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email", fieldErrors: fieldErrorsOf(parsed.error) };
  if (parsed.data.company) return { ok: true, message: "You're subscribed." };
  try {
    const meta = await requestMeta();
    const ipHash = await hashIp(meta.ip);
    const limit = await rateLimit("subscribe", ipHash, 10, 60 * 60);
    if (!limit.allowed) return { ok: false, message: "Too many attempts. Please try again later." };
    const db = await getDb();
    await db
      .insert(subscribers)
      .values({ email: parsed.data.email.toLowerCase(), sourcePath: sourcePath.slice(0, 200), ipHash })
      .onConflictDoUpdate({ target: subscribers.email, set: { status: "subscribed", updatedAt: new Date() } });
    return { ok: true, message: "You're subscribed. Thank you for following Talindia." };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}
