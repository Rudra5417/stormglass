"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="sg-display text-xl tracking-wide text-sg-gold sm:text-2xl">
        {code}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="min-h-11 px-1 text-sm text-sg-cyan"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
