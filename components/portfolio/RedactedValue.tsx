"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion, scrambleTo } from "@/lib/scramble";

const BAR_WIDTHS = [15, 23, 12, 27, 17, 13];

export function RedactedValue({
  value,
  revealed,
  suffix,
}: {
  value: string | null;
  revealed: boolean;
  suffix?: string;
}) {
  const [shown, setShown] = useState(value ?? "");

  useEffect(() => {
    if (!revealed || value === null) return;
    return scrambleTo(setShown, value, { reduced: prefersReducedMotion() });
  }, [revealed, value]);

  if (revealed && value !== null) {
    return (
      <span className="glow-gild font-mono tabular-nums">
        {shown}
        {suffix && <span className="ml-1 text-xs text-[var(--muted)]">{suffix}</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex select-none items-center gap-[3px] align-middle"
      title="Encrypted balance. Declassify to reveal."
      aria-label="encrypted"
    >
      {BAR_WIDTHS.map((w, i) => (
        <span
          key={i}
          style={{ width: `${w}px`, animationDelay: `${i * 0.11}s` }}
          className="redact-bar inline-block h-[15px] rounded-[1px] bg-[#0d1211] ring-1 ring-inset ring-[color-mix(in_srgb,var(--cipher)_26%,transparent)]"
        />
      ))}
    </span>
  );
}
