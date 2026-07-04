export function Badge({
  tone,
  children,
}: {
  tone: "good" | "bad" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    good: "border-[color-mix(in_srgb,var(--good)_40%,transparent)] text-[var(--good)] bg-[color-mix(in_srgb,var(--good)_8%,transparent)]",
    bad: "border-[color-mix(in_srgb,var(--bad)_40%,transparent)] text-[var(--bad)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)]",
    warn: "border-[color-mix(in_srgb,var(--warn)_40%,transparent)] text-[var(--warn)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)]",
    muted: "border-[var(--line)] text-[var(--muted)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${colors[tone]}`}
    >
      {children}
    </span>
  );
}
