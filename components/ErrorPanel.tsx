"use client";

export default function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="sg-plate px-4 py-4">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 bg-sg-gold px-4 py-2 text-sm font-semibold text-sg-canvas"
        >
          Retry
        </button>
      ) : (
        <a
          href=""
          className="mt-3 inline-block bg-sg-gold px-4 py-2 text-sm font-semibold text-sg-canvas"
        >
          Retry
        </a>
      )}
    </div>
  );
}
