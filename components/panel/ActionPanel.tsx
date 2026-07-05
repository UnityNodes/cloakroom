"use client";

import { useEffect } from "react";
import { useChainId } from "wagmi";
import { SEPOLIA_ID } from "@/lib/chains";
import type { PairView } from "@/lib/pairs";
import type { PairAction } from "@/components/registry/PairRow";
import { Badge } from "@/components/ui/Badge";

const TABS: { id: PairAction; label: string }[] = [
  { id: "shield", label: "Shield" },
  { id: "unshield", label: "Unshield" },
  { id: "faucet", label: "Faucet" },
];

export function ActionPanel({
  pair,
  action,
  onActionChange,
  onClose,
  children,
}: {
  pair: PairView;
  action: PairAction;
  onActionChange: (action: PairAction) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const chainId = useChainId();
  const tabs = TABS.filter((tab) => tab.id !== "faucet" || chainId === SEPOLIA_ID);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="panel-in flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-raised)] p-6 shadow-2xl"
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {pair.underlying.symbol}
              <span className="mx-2 text-[var(--muted)]">⇄</span>
              {pair.confidential.symbol}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {pair.isValid ? <Badge tone="good">active</Badge> : <Badge tone="bad">revoked</Badge>}
              <span className="text-[11px] text-[var(--muted)]">
                {pair.confidential.decimals} decimals confidential
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            Esc
          </button>
        </div>

        {chainId !== SEPOLIA_ID && (
          <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] p-3 text-xs text-[var(--warn)]">
            You are on Ethereum mainnet — these are real assets and real gas.
          </div>
        )}

        {!pair.isValid && (
          <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] p-3 text-xs text-[var(--warn)]">
            This wrapper was revoked in the registry. New wraps are disabled; you can still
            unshield existing confidential balances back to the public token.
          </div>
        )}

        <nav className="mt-5 flex gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] p-1">
          {tabs.map((tab) => {
            const disabled = tab.id === "shield" && !pair.isValid;
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && onActionChange(tab.id)}
                disabled={disabled}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  action === tab.id
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 flex-1">{children}</div>
      </aside>
    </div>
  );
}
