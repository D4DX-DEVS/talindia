"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { enquiries } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { enquiryUpdateSchema, idSchema, type EnquiryUpdateInput } from "@/lib/validation/admin";

export async function updateEnquiry(id: number, input: EnquiryUpdateInput): Promise<SavedResult> {
  return adminMutation(enquiryUpdateSchema, input, async (data, session) => {
    const parsedId = idSchema.parse(id);
    const db = await getDb();
    const [prev] = await db.select({ status: enquiries.status, name: enquiries.name }).from(enquiries).where(eq(enquiries.id, parsedId)).limit(1);
    if (!prev) return { ok: false, message: "This enquiry no longer exists." };
    await db.update(enquiries).set({ status: data.status, notes: data.notes || null, updatedAt: new Date() }).where(eq(enquiries.id, parsedId));
    await logActivity({
      actor: session.email,
      action: "enquiry.update",
      entityType: "enquiry",
      entityId: parsedId,
      summary: prev.status !== data.status ? `${prev.name}: ${prev.status} → ${data.status}` : `${prev.name}: notes updated`,
    });
    revalidatePath("/admin/enquiries", "layout");
    return { ok: true, message: "Enquiry updated.", id: parsedId };
  });
}

export async function deleteEnquiry(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ name: enquiries.name, email: enquiries.email }).from(enquiries).where(eq(enquiries.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This enquiry no longer exists." };
  await db.delete(enquiries).where(eq(enquiries.id, parsed.data));
  await logActivity({ actor: session.email, action: "enquiry.delete", entityType: "enquiry", entityId: parsed.data, summary: row.name });
  revalidatePath("/admin/enquiries", "layout");
  return { ok: true, message: `Deleted the enquiry from ${row.name}.` };
}
