export type StepState = "pending" | "active" | "done" | "error" | "skipped";

export function StepChips({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-[var(--line)]">→</span>}
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${
              step.state === "done"
                ? "border-[color-mix(in_srgb,var(--good)_40%,transparent)] text-[var(--good)]"
                : step.state === "active"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : step.state === "error"
                    ? "border-[color-mix(in_srgb,var(--bad)_40%,transparent)] text-[var(--bad)]"
                    : "border-[var(--line)] text-[var(--muted)]"
            } ${step.state === "skipped" ? "line-through opacity-50" : ""}`}
          >
            {step.state === "active" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            )}
            {step.state === "done" && <span>✓</span>}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
