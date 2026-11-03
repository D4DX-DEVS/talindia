import "server-only";
import { getDb } from "@/db/client";
import { activityLog } from "@/db/schema";
import { hashIp, requestMeta } from "@/lib/security";

export interface ActivityInput {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  summary?: string;
}

/** Append-only audit trail. Failures to log never break the action that triggered them. */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const db = await getDb();
    const meta = await requestMeta();
    await db.insert(activityLog).values({
      actor: input.actor,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId === null || input.entityId === undefined ? null : String(input.entityId),
      summary: (input.summary ?? "").slice(0, 500),
      ipHash: await hashIp(meta.ip),
    });
  } catch {
    // Intentionally swallowed: auditing is best-effort.
  }
}
