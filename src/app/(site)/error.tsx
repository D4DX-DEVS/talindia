"use client";

import { ErrorState } from "@/components/shared/states";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="frame py-24">
      <ErrorState
        title="This page could not load"
        message={`Please try again in a moment.${error.digest ? ` Reference: ${error.digest}` : ""}`}
        onRetry={reset}
        className="bg-paper"
      />
    </section>
  );
}
