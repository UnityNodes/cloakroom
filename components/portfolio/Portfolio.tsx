"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { NoCiphertextError } from "@zama-fhe/sdk";
import {
  useConfidentialBalances,
  useGrantPermit,
  useHasPermit,
} from "@zama-fhe/react-sdk";
import { usePairs } from "@/hooks/usePairs";
import { useUnderlyingBalances } from "@/hooks/useUnderlyingBalances";
import { useActivity } from "@/lib/activity-store";
import { humanizeError } from "@/lib/errors";
import { formatAmount } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RedactedValue } from "./RedactedValue";

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { validPairs, isLoading: pairsLoading } = usePairs();
  const { balances: publicBalances } = useUnderlyingBalances(validPairs);
  const { addEntry, updateEntry } = useActivity();
  const [revealed, setRevealed] = useState(false);
  const [slam, setSlam] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const cAddresses = validPairs.map((p) => p.confidential.address);
  const hasPermit = useHasPermit(
    { contractAddresses: cAddresses },
    { enabled: cAddresses.length > 0 && isConnected },
  );
  const grantPermit = useGrantPermit();

  useEffect(() => {
    if (hasPermit.data === true) setRevealed(true);
  }, [hasPermit.data]);

  useEffect(() => {
    setRevealed(false);
    setDecryptError(null);
  }, [address]);

  const confidentialBalances = useConfidentialBalances(
    { addresses: cAddresses, account: address },
    { enabled: revealed && cAddresses.length > 0 },
  );

  if (!isConnected) {
    return (
      <section className="regmarks rounded-xl border border-dashed border-[var(--line)] p-8 text-center">
        <p className="eyebrow mb-2">Clearance required</p>
        <h2 className="font-display text-lg font-semibold">Your confidential portfolio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Connect a wallet to see public and classified balances side by side. Classified
          balances stay redacted for everyone — including block explorers — until you
          declassify them locally.
        </p>
      </section>
    );
  }

  const onDecryptAll = () => {
    setDecryptError(null);
    const id = `decrypt-${Date.now()}`;
    addEntry({ id, kind: "decrypt", label: "Declassify all balances", status: "pending", chainId });
    grantPermit.mutate(cAddresses, {
      onSuccess: () => {
        setRevealed(true);
        setSlam(true);
        updateEntry(id, { status: "success", detail: "Permit signed, balances declassified" });
      },
      onError: (error) => {
        setDecryptError(humanizeError(error));
        updateEntry(id, { status: "error", detail: humanizeError(error) });
      },
    });
  };

  return (
    <section className="relative">
      {slam && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span
            className="stamp-slam text-3xl sm:text-4xl"
            onAnimationEnd={() => setSlam(false)}
          >
            Declassified
          </span>
        </div>
      )}

      <SectionHeading
        index="Section 01"
        kicker="Holdings"
        title="Portfolio"
        sub="Public balances are visible to anyone. Classified balances declassify only for you, after one signature."
        action={
          revealed ? (
            <button
              onClick={() => setRevealed(false)}
              className="rounded-md border border-[var(--line)] px-4 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
              Reclassify
            </button>
          ) : (
            <button
              onClick={onDecryptAll}
              disabled={grantPermit.isPending || pairsLoading}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-60"
            >
              {grantPermit.isPending ? "Check your wallet…" : "Declassify all balances"}
            </button>
          )
        }
      />

      {decryptError && (
        <p className="mb-3 rounded-md border border-[color-mix(in_srgb,var(--classified)_40%,transparent)] bg-[var(--classified-soft)] px-4 py-2 text-xs">
          {decryptError}
        </p>
      )}

      <div className="stagger grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pairsLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        {!pairsLoading &&
          validPairs.map((pair) => {
            const publicBalance = publicBalances.get(pair.underlying.address);
            const cBalance = confidentialBalances.data?.results.get(pair.confidential.address);
            const cError = confidentialBalances.data?.errors.get(pair.confidential.address);
            const neverHeld = cError instanceof NoCiphertextError;
            const shown = cBalance ?? (neverHeld ? 0n : null);
            return (
              <div
                key={pair.confidential.address}
                className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{pair.underlying.symbol}</p>
                  <p className="font-mono text-sm tabular-nums text-[var(--muted)]">
                    {publicBalance !== undefined
                      ? formatAmount(publicBalance, pair.underlying.decimals)
                      : "—"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
                  <p className="text-sm font-medium text-[var(--accent)]">
                    {pair.confidential.symbol}
                  </p>
                  <div className="text-sm">
                    {revealed && confidentialBalances.isLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : cError && !neverHeld ? (
                      <span className="text-xs text-[var(--classified)]" title={cError.message}>
                        decrypt failed
                      </span>
                    ) : (
                      <RedactedValue
                        revealed={revealed && shown !== null}
                        value={shown !== null ? formatAmount(shown, pair.confidential.decimals) : null}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
