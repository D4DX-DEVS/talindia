"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSubscriberStatus } from "../actions";

export function SubscriberStatusToggle({ id, email, status }: { id: number; email: string; status: "subscribed" | "unsubscribed" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = status === "subscribed" ? "unsubscribed" : "subscribed";
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={status === "subscribed" ? `Unsubscribe ${email}` : `Resubscribe ${email}`}
      title={status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
      onClick={() =>
        startTransition(async () => {
          const r = await setSubscriberStatus(id, next);
          if (r.ok) {
            toast.success(r.message);
            router.refresh();
          } else toast.error(r.message);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : status === "subscribed" ? <BellOff /> : <BellRing />}
    </Button>
  );
}
