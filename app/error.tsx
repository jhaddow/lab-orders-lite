"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center space-y-4 max-w-lg mx-auto">
      <p className="text-[11px] uppercase tracking-[0.18em] text-destructive">Error</p>
      <h1 className="font-display text-2xl tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or go back and pick a different action.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/70 font-mono tabular-nums">
          Ref: {error.digest}
        </p>
      )}
      <div className="pt-2">
        <Button onClick={reset} className="h-10 px-5">
          Try again
        </Button>
      </div>
    </div>
  );
}
