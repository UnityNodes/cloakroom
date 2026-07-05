"use client";

import { useState } from "react";
import { usePairs } from "@/hooks/usePairs";
import { pairMatches, type PairView } from "@/lib/pairs";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PairRow, type PairAction } from "./PairRow";

export function PairsTable({
  onAction,
}: {
  onAction: (pair: PairView, action: PairAction) => void;
}) {
  const { revokedPairs, isLoading, error, refetch, pairs } = usePairs();
  const [query, setQuery] = useState("");
  const [showRevoked, setShowRevoked] = useState(false);

  const filteredValid = pairs
    .filter((p) => p.isValid)
    .filter((p) => pairMatches(p, query));
  const filteredRevoked = revokedPairs.filter((p) => pairMatches(p, query));

  return (
    <section>
      <SectionHeading
        index="Section 02"
        kicker="Registry"
        title="Wrapper case files"
        sub={
          isLoading
            ? "Reading pairs from the on-chain registry…"
            : `${pairs.length} pairs on record — read live from the registry, nothing hardcoded.`
        }
        action={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, name or address"
            className="w-64 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        }
      />

      {error != null && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--classified)_40%,transparent)] bg-[var(--classified-soft)] p-4 text-sm">
          <p>Could not read the registry. The RPC may be rate-limited.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-md border border-[var(--line)] px-4 py-1.5 text-xs hover:border-[var(--accent)]"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && error == null && (
        <>
          <div className="stagger space-y-2">
            {filteredValid.map((pair) => (
              <PairRow key={pair.confidential.address} pair={pair} onAction={onAction} />
            ))}
            {filteredValid.length === 0 && (
              <p className="rounded-lg border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
                No case files match that search.
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
                <span className="ref text-[var(--classified)]">REVOKED</span>
                <span>· {filteredRevoked.length} sealed file{filteredRevoked.length > 1 ? "s" : ""}</span>
                <span className="font-normal">
                  — struck from the registry; wrapping is blocked, exits remain possible
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
