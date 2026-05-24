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
    <div className="rounded-md border bg-white p-8 text-center space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-zinc-600">
        An unexpected error occurred. You can try again, or go back and pick a different action.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400 font-mono">Ref: {error.digest}</p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
