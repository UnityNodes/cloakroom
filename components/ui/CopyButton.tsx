"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          void 0;
        }
      }}
      className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      title={`Copy ${label ?? text}`}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
