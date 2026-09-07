"use client";

export default function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-sm border border-sg-panel-2 bg-sg-panel px-4 py-3 shadow-none">
      <p className="text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-sm bg-sg-gold px-3 py-1.5 text-sm font-medium text-sg-canvas shadow-none"
        >
          Retry
        </button>
      ) : (
        <a
          href=""
          className="mt-2 inline-block rounded-sm bg-sg-gold px-3 py-1.5 text-sm font-medium text-sg-canvas shadow-none"
        >
          Retry
        </a>
      )}
    </div>
  );
}
