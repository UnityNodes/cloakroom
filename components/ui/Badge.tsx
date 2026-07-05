export function Badge({
  tone,
  children,
}: {
  tone: "good" | "bad" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    good: "text-[var(--good)]",
    bad: "text-[var(--classified)]",
    warn: "text-[var(--accent)]",
    muted: "text-[var(--muted)]",
  };
  return <span className={`stamp ${colors[tone]}`}>{children}</span>;
}
