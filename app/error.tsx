"use client";

import ErrorPanel from "@/components/ErrorPanel";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel message={error.message} onRetry={reset} />;
}
