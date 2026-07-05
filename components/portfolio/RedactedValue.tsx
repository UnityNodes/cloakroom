"use client";

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
      title="Classified balance. Decrypt to declassify."
      aria-label="classified"
    >
      {BAR_WIDTHS.map((w, i) => (
        <span
          key={i}
          style={{ width: `${w}px`, animationDelay: `${i * 0.11}s` }}
          className="redact-bar inline-block h-[15px] rounded-[1px] bg-[#0b0906] shadow-[inset_0_1px_0_rgba(236,228,211,0.06),inset_0_0_0_1px_rgba(195,71,51,0.14)]"
        />
      ))}
    </span>
  );
}
