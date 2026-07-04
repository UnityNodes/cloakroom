"use client";

import { useState } from "react";
import { usePairs } from "@/hooks/usePairs";
import { pairMatches, type PairView } from "@/lib/pairs";
import { Skeleton } from "@/components/ui/Skeleton";
import { PairRow, type PairAction } from "./PairRow";

export function PairsTable({
  onAction,
}: {
  onAction: (pair: PairView, action: PairAction) => void;
}) {
  const { validPairs, revokedPairs, isLoading, error, refetch, pairs } = usePairs();
  const [query, setQuery] = useState("");
  const [showRevoked, setShowRevoked] = useState(false);

  const filteredValid = validPairs.filter((p) => pairMatches(p, query));
  const filteredRevoked = revokedPairs.filter((p) => pairMatches(p, query));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Wrapper registry</h2>
          <p className="text-xs text-[var(--muted)]">
            {isLoading
              ? "Reading pairs from the on-chain registry…"
              : `${pairs.length} pairs read live from the registry`}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol, name or address"
          className="w-64 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
      </div>

      {error != null && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)] p-4 text-sm">
          <p>Could not read the registry. The RPC may be rate-limited.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-full border border-[var(--line)] px-4 py-1.5 text-xs hover:border-[var(--accent)]"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[62px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && error == null && (
        <>
          <div className="space-y-2">
            {filteredValid.map((pair) => (
              <PairRow key={pair.confidential.address} pair={pair} onAction={onAction} />
            ))}
            {filteredValid.length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
                No pairs match that search.
              </p>
            )}
          </div>

          {filteredRevoked.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowRevoked((v) => !v)}
                className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]"
              >
                <span>{showRevoked ? "▾" : "▸"}</span>
                Revoked pairs ({filteredRevoked.length})
                <span className="font-normal">
                  — removed from the registry; wrapping is blocked, exits remain possible
                </span>
              </button>
              {showRevoked && (
                <div className="space-y-2">
                  {filteredRevoked.map((pair) => (
                    <PairRow key={pair.confidential.address} pair={pair} onAction={onAction} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
