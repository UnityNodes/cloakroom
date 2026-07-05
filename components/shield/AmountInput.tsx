"use client";

export function AmountInput({
  value,
  onChange,
  symbol,
  onMax,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  symbol: string;
  onMax?: () => void;
  disabled?: boolean;
  error?: string | null;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-[var(--panel)] px-4 py-3 focus-within:border-[var(--accent)] ${
          error ? "border-[color-mix(in_srgb,var(--bad)_50%,transparent)]" : "border-[var(--line)]"
        }`}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder="0.0"
          disabled={disabled}
          className="w-full bg-transparent font-mono text-lg tabular-nums outline-none placeholder:text-[var(--muted)] disabled:opacity-50"
        />
        {onMax && (
          <button
            type="button"
            onClick={onMax}
            disabled={disabled}
            className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            MAX
          </button>
        )}
        <span className="text-sm font-medium text-[var(--muted)]">{symbol}</span>
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--bad)]">{error}</p>}
    </div>
  );
}
