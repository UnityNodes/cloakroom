"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useChainId, useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { PairView } from "@/lib/pairs";
import { FAUCET_CAP_TOKENS, FAUCET_PRESETS, mintAbi } from "@/lib/faucet";
import { SEPOLIA_ID, txUrl } from "@/lib/chains";
import { useActivity } from "@/lib/activity-store";
import { humanizeError, rawErrorText } from "@/lib/errors";
import { formatAmount, parseAmount } from "@/lib/format";
import { AmountInput } from "@/components/shield/AmountInput";
import { Skeleton } from "@/components/ui/Skeleton";

export function FaucetPanel({ pair }: { pair: PairView }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const { addEntry, updateEntry } = useActivity();
  const [input, setInput] = useState("1000");
  const [error, setError] = useState<unknown>(null);
  const [activityId, setActivityId] = useState<string | null>(null);

  const decimals = pair.underlying.decimals;
  const cap = FAUCET_CAP_TOKENS * 10n ** BigInt(decimals);
  const amount = parseAmount(input, decimals);

  const probe = useSimulateContract({
    address: pair.underlying.address,
    abi: mintAbi,
    functionName: "mint",
    args: [address ?? "0x000000000000000000000000000000000000dEaD", 10n ** BigInt(decimals)],
    account: address,
    query: { enabled: isConnected, retry: false },
  });
  const mintable = probe.isSuccess;

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (receipt.isSuccess && activityId) {
      updateEntry(activityId, { status: "success", detail: "Minted" });
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      setActivityId(null);
    }
  }, [receipt.isSuccess, activityId, updateEntry, queryClient]);

  const inputError = useMemo(() => {
    if (input === "") return null;
    if (amount === null) return `Enter a valid amount with at most ${decimals} decimals`;
    if (amount > cap)
      return `The faucet mints at most ${formatAmount(cap, decimals)} ${pair.underlying.symbol} per call`;
    return null;
  }, [input, amount, cap, decimals, pair.underlying.symbol]);

  if (chainId !== SEPOLIA_ID) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
        The faucet only exists on Sepolia. Switch networks to mint test tokens.
      </p>
    );
  }

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
        Connect a wallet and the faucet will mint test {pair.underlying.symbol} straight to
        it.
      </p>
    );
  }

  if (probe.isLoading) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  if (!mintable) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">No public faucet for this token</p>
        <p className="mt-2 leading-relaxed">
          {pair.underlying.symbol} does not expose a public mint — it is a restricted or
          production-style asset. Pick any pair marked as a mock to try the full
          shield/unshield loop with free test tokens.
        </p>
      </div>
    );
  }

  const busy = isPending || receipt.isLoading;

  const onMint = () => {
    if (amount === null || inputError || busy) return;
    setError(null);
    const id = `faucet-${pair.underlying.address}-${Date.now()}`;
    setActivityId(id);
    addEntry({
      id,
      kind: "faucet",
      label: `Mint ${input} ${pair.underlying.symbol}`,
      status: "pending",
      chainId,
    });
    writeContract(
      {
        address: pair.underlying.address,
        abi: mintAbi,
        functionName: "mint",
        args: [address!, amount],
      },
      {
        onSuccess: (hash) => updateEntry(id, { txHash: hash, detail: "Mint submitted" }),
        onError: (err) => {
          setError(err);
          updateEntry(id, { status: "error", detail: humanizeError(err) });
          setActivityId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Mint free test {pair.underlying.symbol} to your wallet, then shield them into{" "}
        {pair.confidential.symbol}. Capped at {formatAmount(cap, decimals)} per call by the
        token contract.
      </p>

      <div className="flex flex-wrap gap-2">
        {FAUCET_PRESETS.map((preset) => (
          <button
            key={preset.toString()}
            onClick={() => setInput(preset.toString())}
            disabled={busy}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              input === preset.toString()
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
            }`}
          >
            {formatAmount(preset * 10n ** BigInt(decimals), decimals)}
          </button>
        ))}
      </div>

      <AmountInput
        value={input}
        onChange={setInput}
        symbol={pair.underlying.symbol}
        disabled={busy}
        error={inputError}
      />

      <button
        onClick={onMint}
        disabled={busy || amount === null || amount === 0n || Boolean(inputError)}
        className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Confirm in wallet…" : receipt.isLoading ? "Minting…" : "Mint test tokens"}
      </button>

      {receipt.isSuccess && txHash && (
        <p className="text-center text-xs text-[var(--good)]">
          Minted.{" "}
          <a href={txUrl(chainId, txHash)} target="_blank" rel="noreferrer" className="underline">
            View transaction
          </a>{" "}
          <button onClick={() => reset()} className="ml-1 underline">
            mint again
          </button>
        </p>
      )}

      {error != null && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)] p-3 text-xs">
          <p>{humanizeError(error)}</p>
          <details className="mt-1 text-[var(--muted)]">
            <summary className="cursor-pointer">details</summary>
            <p className="mt-1 break-all font-mono">{rawErrorText(error)}</p>
          </details>
        </div>
      )}
    </div>
  );
}
