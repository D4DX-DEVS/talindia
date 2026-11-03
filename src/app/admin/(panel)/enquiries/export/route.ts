import { ENQUIRY_SORTS, exportEnquiries } from "@/lib/admin/forms-queries";
import { logActivity } from "@/lib/admin/activity";
import { getSession } from "@/lib/auth/session";
import { csvResponse, toCsv } from "@/lib/csv";
import { parseListing } from "@/lib/listing";

export async function GET(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const q = parseListing(sp, { sorts: ENQUIRY_SORTS, defaultSort: "created", defaultOrder: "desc" });
  const rows = await exportEnquiries(q, { status: sp.status, course: sp.course });
  await logActivity({ actor: session.email, action: "enquiry.export", entityType: "enquiry", summary: `${rows.length} rows` });
  const body = toCsv(
    ["id", "received", "status", "name", "email", "phone", "website", "subject", "training", "message", "notes", "source"],
    rows.map((r) => [r.id, r.createdAt, r.status, r.name, r.email, r.phone, r.website, r.subject, r.courseTitle, r.message, r.notes, r.sourcePath]),
  );
  return csvResponse(`talindia-enquiries-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
