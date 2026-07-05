"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import {
  useConfidentialBalance,
  useGrantPermit,
  useHasPermit,
  useResumeUnshield,
  useUnshield,
  useUnshieldAll,
} from "@zama-fhe/react-sdk";
import { NoCiphertextError, type UnshieldCallbacks } from "@zama-fhe/sdk";
import type { PairView } from "@/lib/pairs";
import { useActivity } from "@/lib/activity-store";
import { usePendingUnshields } from "@/hooks/usePendingUnshields";
import { humanizeError, rawErrorText } from "@/lib/errors";
import { formatAmount, parseAmount } from "@/lib/format";
import { AmountInput } from "@/components/shield/AmountInput";
import { RedactedValue } from "@/components/portfolio/RedactedValue";
import { UnshieldTimeline, type UnshieldPhase } from "./UnshieldTimeline";

export function UnshieldPanel({ pair }: { pair: PairView }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const { addEntry, updateEntry } = useActivity();

  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<UnshieldPhase>("idle");
  const [errorStep, setErrorStep] = useState<number | undefined>(undefined);
  const [unwrapTx, setUnwrapTx] = useState<string | null>(null);
  const [finalizeTx, setFinalizeTx] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const hasPermit = useHasPermit(
    { contractAddresses: [pair.confidential.address] },
    { enabled: isConnected },
  );
  const grantPermit = useGrantPermit();
  const balance = useConfidentialBalance(
    { address: pair.confidential.address, account: address },
    { enabled: isConnected && hasPermit.data === true },
  );
  const balanceIsZeroCiphertext = balance.error instanceof NoCiphertextError;
  const knownBalance = balanceIsZeroCiphertext ? 0n : balance.data;

  const { pending, refetch: refetchPending } = usePendingUnshields([pair]);
  const pendingForPair = pending[0] ?? null;

  const unshield = useUnshield(pair.confidential.address);
  const unshieldAll = useUnshieldAll(pair.confidential.address);
  const resumeUnshield = useResumeUnshield(pair.confidential.address);

  const amount = parseAmount(input, pair.confidential.decimals);
  const exceedsBalance =
    amount !== null && knownBalance !== undefined && amount > knownBalance;

  const inputError = useMemo(() => {
    if (input === "") return null;
    if (amount === null)
      return `Enter a valid amount with at most ${pair.confidential.decimals} decimals`;
    if (exceedsBalance) return "That is more than your confidential balance";
    return null;
  }, [input, amount, exceedsBalance, pair.confidential.decimals]);

  const busy = unshield.isPending || unshieldAll.isPending || resumeUnshield.isPending;

  const makeCallbacks = (activityId: string): UnshieldCallbacks => ({
    onUnwrapSubmitted: (txHash) => {
      setPhase("decrypting");
      setUnwrapTx(txHash);
      updateEntry(activityId, { txHash, detail: "Unwrap requested, awaiting public decryption" });
      refetchPending();
    },
    onFinalizing: () => {
      setPhase("finalize-signing");
      updateEntry(activityId, { detail: "Decryption proof ready, confirm finalize in wallet" });
    },
    onFinalizeSubmitted: (txHash) => {
      setPhase("finalizing");
      setFinalizeTx(txHash);
      updateEntry(activityId, { txHash, detail: "Finalize submitted" });
    },
  });

  const currentErrorStep = (): number => {
    switch (phase) {
      case "signing":
        return 0;
      case "decrypting":
        return 1;
      case "finalize-signing":
      case "finalizing":
        return 2;
      default:
        return 0;
    }
  };

  const handleOutcome = (activityId: string) => ({
    onSuccess: () => {
      setPhase("done");
      updateEntry(activityId, { status: "success", detail: "Unshielded" });
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      refetchPending();
    },
    onError: (err: unknown) => {
      setErrorStep(currentErrorStep());
      setPhase("error");
      setError(err);
      updateEntry(activityId, { status: "error", detail: humanizeError(err) });
      refetchPending();
    },
  });

  const start = (mode: "amount" | "all") => {
    if (!isConnected || busy) return;
    setError(null);
    setErrorStep(undefined);
    setUnwrapTx(null);
    setFinalizeTx(null);
    setPhase("signing");
    const id = `unshield-${pair.confidential.address}-${Date.now()}`;
    addEntry({
      id,
      kind: "unshield",
      label:
        mode === "all"
          ? `Unshield all ${pair.confidential.symbol}`
          : `Unshield ${input} ${pair.confidential.symbol}`,
      status: "pending",
      chainId,
    });
    const callbacks = makeCallbacks(id);
    if (mode === "all") {
      unshieldAll.mutate({ ...callbacks }, handleOutcome(id));
    } else if (amount !== null) {
      unshield.mutate({ amount, ...callbacks }, handleOutcome(id));
    }
  };

  const resume = () => {
    if (!pendingForPair || busy) return;
    setError(null);
    setErrorStep(undefined);
    setUnwrapTx(pendingForPair.request.unwrapTxHash);
    setFinalizeTx(null);
    setPhase("decrypting");
    const id = `unshield-resume-${pair.confidential.address}-${Date.now()}`;
    addEntry({
      id,
      kind: "unshield",
      label: `Resume unshield ${pair.confidential.symbol}`,
      status: "pending",
      txHash: pendingForPair.request.unwrapTxHash,
      chainId,
    });
    resumeUnshield.mutate(
      { unwrapTxHash: pendingForPair.request.unwrapTxHash, ...makeCallbacks(id) },
      handleOutcome(id),
    );
  };

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
        Connect a wallet to unshield {pair.confidential.symbol} back to public{" "}
        {pair.underlying.symbol}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Unwrapping is a two-step flow: the encrypted amount must be publicly decrypted
        before the public tokens are released. Expect two wallet confirmations.
      </p>

      {pendingForPair && phase === "idle" && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] p-4">
          <p className="text-sm font-medium text-[var(--warn)]">Unfinished unwrap found</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            An earlier unwrap request was never finalized (page closed mid-flow?). Nothing
            is lost. Finish it now.
          </p>
          <button
            onClick={resume}
            disabled={busy}
            className="mt-3 rounded-full bg-[var(--warn)] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-60"
          >
            Resume and finalize
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>Confidential balance</span>
        {hasPermit.data === true ? (
          <span className="font-mono tabular-nums text-[var(--text)]">
            {knownBalance !== undefined ? (
              `${formatAmount(knownBalance, pair.confidential.decimals)} ${pair.confidential.symbol}`
            ) : balance.isLoading ? (
              "decrypting…"
            ) : (
              "·"
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <RedactedValue revealed={false} value={null} />
            <button
              onClick={() => grantPermit.mutate([pair.confidential.address])}
              disabled={grantPermit.isPending}
              className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-60"
            >
              {grantPermit.isPending ? "signing…" : "decrypt"}
            </button>
          </span>
        )}
      </div>

      {phase === "idle" || phase === "error" ? (
        <>
          <AmountInput
            value={input}
            onChange={setInput}
            symbol={pair.confidential.symbol}
            disabled={busy}
            error={inputError}
            onMax={
              knownBalance !== undefined
                ? () =>
                    setInput(
                      formatAmount(knownBalance, pair.confidential.decimals, pair.confidential.decimals).replace(/,/g, ""),
                    )
                : undefined
            }
          />
          {hasPermit.data !== true && (
            <p className="text-[11px] leading-relaxed text-[var(--muted)]">
              Amounts are checked against your decrypted balance before sending, so decrypt
              first, or use “Unshield everything”, which works straight on the encrypted
              balance without revealing it.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => start("amount")}
              disabled={busy || amount === null || amount === 0n || Boolean(inputError) || hasPermit.data !== true}
              className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Unshield amount
            </button>
            <button
              onClick={() => start("all")}
              disabled={busy || balanceIsZeroCiphertext}
              title={
                balanceIsZeroCiphertext
                  ? "Nothing to unshield: this account never held this token"
                  : "Unwraps the full encrypted balance without decrypting it"
              }
              className="flex-1 rounded-full border border-[var(--line)] py-3 text-sm font-medium transition-colors hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Unshield everything
            </button>
          </div>
        </>
      ) : null}

      <UnshieldTimeline
        phase={phase}
        errorStep={errorStep}
        unwrapTx={unwrapTx}
        finalizeTx={finalizeTx}
      />

      {phase === "done" && (
        <button
          onClick={() => {
            setPhase("idle");
            setInput("");
          }}
          className="w-full rounded-full border border-[var(--line)] py-2.5 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
        >
          Done. Unshield more
        </button>
      )}

      {error != null && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)] p-3 text-xs">
          <p>{humanizeError(error)}</p>
          {unwrapTx && (
            <p className="mt-1 text-[var(--muted)]">
              The unwrap request is saved. Reopen this panel any time and hit Resume. Nothing
              is lost.
            </p>
          )}
          <details className="mt-1 text-[var(--muted)]">
            <summary className="cursor-pointer">details</summary>
            <p className="mt-1 break-all font-mono">{rawErrorText(error)}</p>
          </details>
        </div>
      )}
    </div>
  );
}
