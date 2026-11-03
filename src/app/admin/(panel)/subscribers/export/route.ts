import { SUBSCRIBER_SORTS, exportSubscribers } from "@/lib/admin/forms-queries";
import { logActivity } from "@/lib/admin/activity";
import { getSession } from "@/lib/auth/session";
import { csvResponse, toCsv } from "@/lib/csv";
import { parseListing } from "@/lib/listing";

export async function GET(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const q = parseListing(sp, { sorts: SUBSCRIBER_SORTS, defaultSort: "created", defaultOrder: "desc" });
  const rows = await exportSubscribers(q, sp.status);
  await logActivity({ actor: session.email, action: "subscriber.export", entityType: "subscriber", summary: `${rows.length} rows` });
  const body = toCsv(["id", "email", "status", "source", "joined", "updated"], rows.map((r) => [r.id, r.email, r.status, r.sourcePath, r.createdAt, r.updatedAt]));
  return csvResponse(`talindia-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
