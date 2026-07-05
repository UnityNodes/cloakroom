"use client";

import { useState } from "react";
import type { PairView } from "@/lib/pairs";
import { usePairs } from "@/hooks/usePairs";
import { usePendingUnshields } from "@/hooks/usePendingUnshields";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { DecryptAnyToken } from "@/components/portfolio/DecryptAnyToken";
import { PairsTable } from "@/components/registry/PairsTable";
import { ActionPanel } from "@/components/panel/ActionPanel";
import { ShieldPanel } from "@/components/shield/ShieldPanel";
import { UnshieldPanel } from "@/components/unshield/UnshieldPanel";
import { FaucetPanel } from "@/components/faucet/FaucetPanel";
import { ActivityDrawer } from "@/components/activity/ActivityDrawer";
import type { PairAction } from "@/components/registry/PairRow";

export function Dashboard() {
  const [selected, setSelected] = useState<{ pair: PairView; action: PairAction } | null>(null);
  const { pairs } = usePairs();
  const { pending } = usePendingUnshields(pairs);

  return (
    <div className="space-y-10">
      {pending.length > 0 && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <span className="font-medium text-[var(--warn)]">
                {pending.length} unfinished unwrap{pending.length > 1 ? "s" : ""}
              </span>{" "}
              <span className="text-[var(--muted)]">
                requested earlier, never finalized. Your funds are safe.
              </span>
            </p>
            <div className="flex gap-2">
              {pending.map(({ pair }) => (
                <button
                  key={pair.confidential.address}
                  onClick={() => setSelected({ pair, action: "unshield" })}
                  className="rounded-full border border-[var(--warn)] px-3 py-1 text-xs font-medium text-[var(--warn)] hover:bg-[color-mix(in_srgb,var(--warn)_15%,transparent)]"
                >
                  Resume {pair.confidential.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <Portfolio />
        <DecryptAnyToken />
      </div>

      <div className="border-t border-[var(--line-soft)] pt-10">
        <PairsTable onAction={(pair, action) => setSelected({ pair, action })} />
      </div>

      {selected && (
        <ActionPanel
          pair={selected.pair}
          action={selected.action}
          onActionChange={(action) => setSelected({ ...selected, action })}
          onClose={() => setSelected(null)}
        >
          {selected.action === "shield" && <ShieldPanel pair={selected.pair} />}
          {selected.action === "unshield" && <UnshieldPanel pair={selected.pair} />}
          {selected.action === "faucet" && <FaucetPanel pair={selected.pair} />}
        </ActionPanel>
      )}

      <ActivityDrawer />
    </div>
  );
}
