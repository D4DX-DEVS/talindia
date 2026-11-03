import "server-only";
import { updateTag } from "next/cache";
import type { z } from "zod";
import { requireAdmin, type AdminSession } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionResult } from "@/lib/validation/forms";

export type { ActionResult };

export interface SavedResult extends ActionResult {
  id?: number;
}

/** Thrown inside an admin action to return a message to the form instead of a generic error. */
export class UserError extends Error {}

/**
 * Wraps an admin mutation: verifies the session, validates input with the shared schema,
 * maps errors to a form-friendly result and never leaks driver messages to the browser.
 */
export async function adminMutation<S extends z.ZodType, R extends SavedResult>(
  schema: S,
  input: unknown,
  run: (data: z.infer<S>, session: AdminSession) => Promise<R>,
): Promise<R | ActionResult> {
  const session = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  try {
    return await run(parsed.data, session);
  } catch (error) {
    if (error instanceof UserError) return { ok: false, message: error.message };
    const msg = error instanceof Error ? error.message : "";
    if (/UNIQUE constraint failed/i.test(msg)) return { ok: false, message: "That slug is already used by another entry.", fieldErrors: { slug: "Already in use" } };
    if (/FOREIGN KEY constraint failed/i.test(msg)) return { ok: false, message: "This item is still referenced elsewhere." };
    return { ok: false, message: "Saving failed. Please try again." };
  }
}

/** Expire public caches immediately so the editor sees the change on the next visit. */
export function invalidate(...tags: string[]): void {
  for (const tag of new Set(tags)) updateTag(tag);
}
