"use client";

export function RedactedValue({
  value,
  revealed,
  suffix,
}: {
  value: string | null;
  revealed: boolean;
  suffix?: string;
}) {
  if (revealed && value !== null) {
    return (
      <span className="font-mono tabular-nums text-[var(--text)] [animation:reveal_.45s_ease]">
        {value}
        {suffix && <span className="ml-1 text-xs text-[var(--muted)]">{suffix}</span>}
      </span>
    );
  }
  return (
    <span
      className="inline-flex select-none items-center gap-[3px] align-middle"
      title="Encrypted balance. Decrypt to reveal."
      aria-label="encrypted"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.12}s` }}
          className="redact-bar inline-block h-3.5 w-2.5 rounded-[2px] bg-[var(--panel-2)] ring-1 ring-inset ring-[var(--line)]"
        />
      ))}
    </span>
  );
}
