"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { lookupHref, parseIslandCode } from "@/lib/fortnite/normalize";

const BROKEN_CODE = /^[\d-]+$/;
const INVALID_CODE_MESSAGE = "Enter a code like 6980-2761-9936";

export default function Lookup({
  size = "hero",
}: {
  size?: "hero" | "compact";
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const compact = size === "compact";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (parseIslandCode(trimmed)) {
      setError(null);
      router.push(lookupHref(trimmed));
      return;
    }
    if (trimmed && BROKEN_CODE.test(trimmed)) {
      setError(INVALID_CODE_MESSAGE);
      return;
    }
    setError(null);
    router.push(lookupHref(trimmed));
  }

  return (
    <form
      action="/search"
      method="get"
      onSubmit={onSubmit}
      className="flex min-w-0 flex-1 flex-col gap-2"
    >
      <label
        htmlFor={inputId}
        className={compact ? "sr-only" : "text-sm text-sg-mute"}
      >
        Island code
      </label>
      <div
        className={
          compact
            ? "flex min-w-0 items-stretch gap-2"
            : "flex min-w-0 flex-col items-stretch gap-2 sm:flex-row"
        }
      >
        <input
          id={inputId}
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="6980-2761-9936"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={
            compact
              ? "sg-display min-w-0 w-full flex-1 border border-sg-gold/40 bg-sg-canvas px-3 py-3 text-base tracking-wide text-sg-ink outline-none placeholder:text-sg-mute/70"
              : "sg-display min-w-0 w-full flex-1 border border-sg-gold/40 bg-sg-canvas px-3 py-3 text-xl tracking-wide text-sg-ink outline-none placeholder:text-sg-mute/70 sm:px-4 sm:py-4 sm:text-3xl"
          }
        />
        <button
          type="submit"
          className={
            compact
              ? "min-h-11 shrink-0 bg-sg-gold px-4 text-sm font-semibold text-sg-canvas"
              : "min-h-12 shrink-0 bg-sg-gold px-6 text-sm font-semibold text-sg-canvas sm:min-h-0"
          }
        >
          Look up
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-sg-gold">
          {error}
        </p>
      ) : null}
    </form>
  );
}
