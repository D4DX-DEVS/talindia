import { CircleCheck, CircleDot, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EnquiryStatus } from "@/db/schema";

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  closed: "Closed",
  spam: "Spam",
};

export const ENQUIRY_STATUS_OPTIONS = (Object.keys(ENQUIRY_STATUS_LABEL) as EnquiryStatus[]).map((value) => ({ value, label: ENQUIRY_STATUS_LABEL[value] }));

const ICONS = { new: CircleDot, in_progress: Clock, closed: CircleCheck, spam: ShieldAlert } as const;
const TONES: Record<EnquiryStatus, string> = {
  new: "bg-violet-100 text-violet-900 hover:bg-violet-100",
  in_progress: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  closed: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  spam: "bg-muted text-muted-foreground hover:bg-muted",
};

/** Text and icon carry the status; colour only reinforces it. */
export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const Icon = ICONS[status];
  return (
    <Badge className={`gap-1 ${TONES[status]}`}>
      <Icon className="size-3" aria-hidden /> {ENQUIRY_STATUS_LABEL[status]}
    </Badge>
  );
}
