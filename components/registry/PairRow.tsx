"use client";

import type { PairView } from "@/lib/pairs";
import { addressUrl } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";

export type PairAction = "shield" | "unshield" | "faucet";

function TokenCell({
  symbol,
  name,
  address,
  confidential,
}: {
  symbol: string;
  name: string;
  address: string;
  confidential?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            confidential
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--panel-2)] text-[var(--muted)]"
          }`}
        >
          {symbol.replace(/^c/, "").slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{symbol}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <a
              href={addressUrl(address)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono hover:text-[var(--accent)]"
            >
              {shortAddress(address)}
            </a>
            <CopyButton text={address} label={`${symbol} address`} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function PairRow({
  pair,
  onAction,
}: {
  pair: PairView;
  onAction: (pair: PairView, action: PairAction) => void;
}) {
  const revoked = !pair.isValid;
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] sm:gap-4 ${
        revoked ? "opacity-75" : ""
      }`}
    >
      <TokenCell
        symbol={pair.underlying.symbol}
        name={pair.underlying.name}
        address={pair.underlying.address}
      />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[var(--muted)]">⇄</span>
        {revoked ? (
          <Badge tone="bad">revoked</Badge>
        ) : (
          <Badge tone="good">active</Badge>
        )}
      </div>
      <TokenCell
        symbol={pair.confidential.symbol}
        name={pair.confidential.name}
        address={pair.confidential.address}
        confidential
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => onAction(pair, "shield")}
          disabled={revoked}
          title={revoked ? "This wrapper was revoked in the registry. Wrapping is disabled." : undefined}
          className="rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Shield
        </button>
        <button
          onClick={() => onAction(pair, "unshield")}
          className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)]"
        >
          Unshield
        </button>
        <button
          onClick={() => onAction(pair, "faucet")}
          className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
        >
          Faucet
        </button>
      </div>
    </div>
  );
}
