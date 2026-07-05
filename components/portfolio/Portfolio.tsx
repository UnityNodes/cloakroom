"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
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
import { RedactedValue } from "./RedactedValue";

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const { validPairs, isLoading: pairsLoading } = usePairs();
  const { balances: publicBalances } = useUnderlyingBalances(validPairs);
  const { addEntry, updateEntry } = useActivity();
  const [revealed, setRevealed] = useState(false);
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
      <section className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center">
        <h2 className="font-display text-lg font-semibold">Your confidential portfolio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
          Connect a wallet to see public and encrypted balances side by side. Encrypted
          balances stay hidden from everyone — including block explorers — until you
          decrypt them locally.
        </p>
      </section>
    );
  }

  const onDecryptAll = () => {
    setDecryptError(null);
    const id = `decrypt-${Date.now()}`;
    addEntry({ id, kind: "decrypt", label: "Decrypt all balances", status: "pending" });
    grantPermit.mutate(cAddresses, {
      onSuccess: () => {
        setRevealed(true);
        updateEntry(id, { status: "success", detail: "Permit signed, balances decrypted" });
      },
      onError: (error) => {
        setDecryptError(humanizeError(error));
        updateEntry(id, { status: "error", detail: humanizeError(error) });
      },
    });
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Holdings</p>
          <h2 className="font-display text-xl font-semibold">Portfolio</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Public balances are visible to anyone. Confidential balances decrypt only for
            you, after one signature.
          </p>
        </div>
        {revealed ? (
          <button
            onClick={() => setRevealed(false)}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            Hide balances
          </button>
        ) : (
          <button
            onClick={onDecryptAll}
            disabled={grantPermit.isPending || pairsLoading}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-60"
          >
            {grantPermit.isPending ? "Check your wallet…" : "Decrypt all balances"}
          </button>
        )}
      </div>

      {decryptError && (
        <p className="mb-3 rounded-lg border border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)] px-4 py-2 text-xs">
          {decryptError}
        </p>
      )}

      <div className="stagger grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pairsLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
                className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"
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
                      <span className="text-xs text-[var(--bad)]" title={cError.message}>
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
