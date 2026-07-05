"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { erc20Abi } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { useShield, useUnderlyingAllowance } from "@zama-fhe/react-sdk";
import type { PairView } from "@/lib/pairs";
import { txUrl } from "@/lib/chains";
import { useActivity } from "@/lib/activity-store";
import { humanizeError, rawErrorText } from "@/lib/errors";
import { formatAmount, parseAmount, wrapPreview } from "@/lib/format";
import { AmountInput } from "./AmountInput";
import { StepChips, type StepState } from "@/components/ui/StepChips";

export function ShieldPanel({ pair }: { pair: PairView }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const { addEntry, updateEntry } = useActivity();
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<{ approve: StepState; wrap: StepState }>({
    approve: "pending",
    wrap: "pending",
  });
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const balance = useReadContract({
    address: pair.underlying.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  });

  const allowance = useUnderlyingAllowance(
    { address: pair.confidential.address, owner: address },
    { enabled: Boolean(address) },
  );

  const shield = useShield({ address: pair.confidential.address });

  const amount = parseAmount(input, pair.underlying.decimals);
  const preview = amount !== null ? wrapPreview(amount, pair.rate) : null;
  const exceedsBalance =
    amount !== null && balance.data !== undefined && amount > (balance.data as bigint);
  const belowRate = preview !== null && amount !== null && amount > 0n && preview.credited === 0n;
  const needsApproval =
    amount !== null && allowance.data !== undefined && allowance.data < amount;

  const inputError = useMemo(() => {
    if (input === "") return null;
    if (amount === null) return `Enter a valid amount with at most ${pair.underlying.decimals} decimals`;
    if (exceedsBalance) return "That is more than your public balance";
    if (belowRate)
      return `Below the minimum unit. Amounts smaller than ${formatAmount(pair.rate, pair.underlying.decimals, pair.underlying.decimals)} ${pair.underlying.symbol} would wrap to 0`;
    return null;
  }, [input, amount, exceedsBalance, belowRate, pair]);

  const busy = shield.isPending;
  const canSubmit =
    isConnected && amount !== null && amount > 0n && !inputError && !busy && pair.isValid;

  const onSubmit = () => {
    if (!canSubmit || amount === null) return;
    setError(null);
    setLastTx(null);
    setSteps({ approve: needsApproval ? "active" : "skipped", wrap: needsApproval ? "pending" : "active" });
    const id = `shield-${pair.confidential.address}-${Date.now()}`;
    addEntry({
      id,
      kind: "shield",
      label: `Shield ${input} ${pair.underlying.symbol}`,
      status: "pending",
      chainId,
    });
    shield.mutate(
      {
        amount,
        approvalStrategy: "exact",
        onApprovalSubmitted: (txHash) => {
          setSteps((s) => ({ ...s, approve: "done" }));
          updateEntry(id, { txHash, detail: "Approval submitted" });
        },
        onShieldSubmitted: (txHash) => {
          setSteps((s) => ({ approve: s.approve === "active" ? "done" : s.approve, wrap: "active" }));
          setLastTx(txHash);
          updateEntry(id, { txHash, detail: "Wrap submitted" });
        },
      },
      {
        onSuccess: (result) => {
          setSteps({ approve: "done", wrap: "done" });
          setLastTx(result.txHash);
          setInput("");
          updateEntry(id, { status: "success", txHash: result.txHash, detail: "Wrapped" });
          queryClient.invalidateQueries({ queryKey: ["readContract"] });
          queryClient.invalidateQueries({ queryKey: ["readContracts"] });
        },
        onError: (err) => {
          setSteps({ approve: "pending", wrap: "pending" });
          setError(err);
          updateEntry(id, { status: "error", detail: humanizeError(err) });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Wrap public {pair.underlying.symbol} into confidential {pair.confidential.symbol}. The
        amount you wrap is the last public trace. After that, transfers and balances stay
        encrypted.
      </p>

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>Public balance</span>
        <span className="font-mono tabular-nums">
          {balance.data !== undefined
            ? `${formatAmount(balance.data as bigint, pair.underlying.decimals)} ${pair.underlying.symbol}`
            : "·"}
        </span>
      </div>

      <AmountInput
        value={input}
        onChange={setInput}
        symbol={pair.underlying.symbol}
        disabled={busy}
        error={inputError}
        onMax={() =>
          balance.data !== undefined &&
          setInput(formatAmount(balance.data as bigint, pair.underlying.decimals, pair.underlying.decimals).replace(/,/g, ""))
        }
      />

      {preview && amount !== null && amount > 0n && !belowRate && (
        <div className="space-y-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">You receive</span>
            <span className="font-mono tabular-nums">
              {formatAmount(preview.credited, pair.confidential.decimals)} {pair.confidential.symbol}
            </span>
          </div>
          {pair.rate > 1n && (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Actually wrapped</span>
                <span className="font-mono tabular-nums">
                  {formatAmount(preview.wrapped, pair.underlying.decimals, pair.underlying.decimals)}{" "}
                  {pair.underlying.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Returned to you (rounding)</span>
                <span className="font-mono tabular-nums">
                  {formatAmount(preview.refund, pair.underlying.decimals, pair.underlying.decimals)}{" "}
                  {pair.underlying.symbol}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                Confidential tokens use {pair.confidential.decimals} decimals, so amounts are
                floored to {formatAmount(pair.rate, pair.underlying.decimals, pair.underlying.decimals)}{" "}
                {pair.underlying.symbol} steps. The remainder never leaves your wallet.
              </p>
            </>
          )}
        </div>
      )}

      <StepChips
        steps={[
          { label: needsApproval ? "Approve" : "Approve (not needed)", state: steps.approve },
          { label: "Wrap", state: steps.wrap },
        ]}
      />

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!isConnected
          ? "Connect a wallet to shield"
          : busy
            ? "Confirm in wallet…"
            : `Shield ${pair.underlying.symbol}`}
      </button>

      {lastTx && !busy && steps.wrap === "done" && (
        <p className="text-center text-xs text-[var(--good)]">
          Wrapped.{" "}
          <a href={txUrl(chainId, lastTx)} target="_blank" rel="noreferrer" className="underline">
            View transaction
          </a>
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
