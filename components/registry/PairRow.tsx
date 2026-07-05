"use client";

import { useChainId } from "wagmi";
import type { PairView } from "@/lib/pairs";
import { SEPOLIA_ID, addressUrl } from "@/lib/chains";
import { fileNumber, shortAddress } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { ScrambleText } from "@/components/ui/ScrambleText";

export type PairAction = "shield" | "unshield" | "faucet";

function TokenCell({
  symbol,
  address,
  confidential,
}: {
  symbol: string;
  address: string;
  confidential?: boolean;
}) {
  const chainId = useChainId();
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] font-mono text-[10px] font-bold ${
            confidential
              ? "bg-[var(--cipher-soft)] text-[var(--cipher)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--cipher)_32%,transparent)]"
              : "bg-[var(--panel-2)] text-[var(--muted)] ring-1 ring-inset ring-[var(--line)]"
          }`}
        >
          {symbol.replace(/^c/, "").slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{symbol}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <a
              href={addressUrl(chainId, address)}
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
  index,
  onAction,
}: {
  pair: PairView;
  index: number;
  onAction: (pair: PairView, action: PairAction) => void;
}) {
  const revoked = !pair.isValid;
  const broken = Boolean(pair.configError);
  const chainId = useChainId();
  const decLabel = `${pair.underlying.decimals}→${pair.confidential.decimals} dec`;

  return (
    <div
      className={`group depth relative rounded-lg border border-[var(--line)] pl-4 pr-4 py-3 transition-all hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] ${
        revoked || broken ? "opacity-80" : ""
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-[3px] rounded-full ${
          broken || revoked
            ? "bg-[color-mix(in_srgb,var(--classified)_55%,transparent)]"
            : "bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] group-hover:bg-[color-mix(in_srgb,var(--accent)_65%,transparent)]"
        } transition-colors`}
      />

      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-[var(--line-soft)] pb-2">
        <span className="ref flex items-center gap-1.5">
          <span className="text-[var(--accent)]">{String(index).padStart(3, "0")}</span>
          <span className="text-[color-mix(in_srgb,var(--muted)_75%,transparent)]">CASE&nbsp;FILE</span>
          <ScrambleText
            className="text-[var(--text)]"
            text={fileNumber(pair.confidential.address)}
            delay={index * 55}
          />
        </span>
        <div className="flex items-center gap-1.5">
          {pair.source === "custom" && !broken && <Badge tone="warn">custom</Badge>}
          {broken ? (
            <Badge tone="bad">config error</Badge>
          ) : revoked ? (
            <Badge tone="bad">revoked</Badge>
          ) : (
            <Badge tone="good">active</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr_auto]">
        <TokenCell symbol={pair.underlying.symbol} address={pair.underlying.address} />
        <div className="flex flex-col items-center gap-0.5" title={`1 confidential unit = ${pair.rate} underlying`}>
          <span className="font-mono text-[var(--muted)]" aria-hidden>
            ⇄
          </span>
          <span className="ref text-[9px] leading-none text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
            {decLabel}
          </span>
        </div>
        <TokenCell symbol={pair.confidential.symbol} address={pair.confidential.address} confidential />
        <div className="col-span-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line-soft)] pt-2.5 lg:col-span-1 lg:border-t-0 lg:pt-0">
          <button
            onClick={() => onAction(pair, "shield")}
            disabled={revoked || broken}
            title={
              broken
                ? pair.configError
                : revoked
                  ? "This wrapper was revoked in the registry. Wrapping is disabled."
                  : undefined
            }
            className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Shield
          </button>
          <button
            onClick={() => onAction(pair, "unshield")}
            disabled={broken}
            title={broken ? pair.configError : undefined}
            className="rounded-md border border-[var(--line)] px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Unshield
          </button>
          {chainId === SEPOLIA_ID && (
            <button
              onClick={() => onAction(pair, "faucet")}
              disabled={broken}
              title={broken ? pair.configError : undefined}
              className="rounded-md border border-[var(--line)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Faucet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
