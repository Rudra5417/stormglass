"use client";

import { useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm">
      <span>{code}</span>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-sm border border-sg-panel-2 bg-sg-panel-2 px-2 py-0.5 text-xs text-sg-cyan"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
