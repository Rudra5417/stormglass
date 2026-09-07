"use client";

import ErrorPanel from "@/components/ErrorPanel";

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return <ErrorPanel message={error.message} onRetry={retry ?? reset} />;
}
