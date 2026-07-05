export function SectionHeading({
  index,
  kicker,
  title,
  sub,
  action,
}: {
  index: string;
  kicker: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="eyebrow inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2 w-2 rounded-[1px] bg-[var(--accent)]" />
          {index} · {kicker}
        </span>
        <h2 className="mt-2 font-display text-xl font-semibold">{title}</h2>
        {sub && <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-[var(--muted)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
