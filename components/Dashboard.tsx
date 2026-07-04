"use client";

import { useState } from "react";
import type { PairView } from "@/lib/pairs";
import { PairsTable } from "@/components/registry/PairsTable";
import { ActionPanel } from "@/components/panel/ActionPanel";
import type { PairAction } from "@/components/registry/PairRow";

export function Dashboard() {
  const [selected, setSelected] = useState<{ pair: PairView; action: PairAction } | null>(null);

  return (
    <div className="space-y-10">
      <PairsTable
        onAction={(pair, action) => setSelected({ pair, action })}
      />

      {selected && (
        <ActionPanel
          pair={selected.pair}
          action={selected.action}
          onActionChange={(action) => setSelected({ ...selected, action })}
          onClose={() => setSelected(null)}
        >
          <p className="text-sm text-[var(--muted)]">
            {selected.action} flow lands in the next commits.
          </p>
        </ActionPanel>
      )}
    </div>
  );
}
