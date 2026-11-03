import { CircleCheck, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Status shown with text and icon, never colour alone. */
export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <Badge className="gap-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
      <CircleCheck className="size-3" aria-hidden /> Published
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <CircleDashed className="size-3" aria-hidden /> Draft
    </Badge>
  );
}
