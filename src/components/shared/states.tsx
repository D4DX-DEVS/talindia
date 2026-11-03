import Link from "next/link";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 bg-card px-6 py-14 text-center", className)}>
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link href={action.href} className="mt-2 inline-flex min-h-11 items-center bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-indigo">
          {action.label}
        </Link>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 bg-card px-6 py-14 text-center", className)}>
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <p className="text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-sm font-semibold text-white hover:bg-indigo">
          <RotateCcw className="size-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}
