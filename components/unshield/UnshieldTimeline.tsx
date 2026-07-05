"use client";

import { useChainId } from "wagmi";
import { txUrl } from "@/lib/chains";

export type UnshieldPhase =
  | "idle"
  | "signing"
  | "decrypting"
  | "finalize-signing"
  | "finalizing"
  | "done"
  | "error";

const STEPS = [
  {
    id: "request",
    title: "Request unwrap",
    hint: "Transaction 1 of 2. Your encrypted amount is submitted on-chain.",
  },
  {
    id: "decrypt",
    title: "Public decryption",
    hint: "The relayer network decrypts the unwrap amount and produces a proof. No wallet action needed.",
  },
  {
    id: "finalize",
    title: "Finalize",
    hint: "Transaction 2 of 2. The proof is submitted and public tokens are released.",
  },
  {
    id: "complete",
    title: "Complete",
    hint: "Public tokens are back in the recipient wallet.",
  },
] as const;

function stepState(stepIndex: number, phase: UnshieldPhase): "pending" | "active" | "done" | "error" {
  const order: Record<Exclude<UnshieldPhase, "idle" | "error">, number> = {
    signing: 0,
    decrypting: 1,
    "finalize-signing": 2,
    finalizing: 2,
    done: 4,
  };
  if (phase === "idle") return "pending";
  if (phase === "error") return stepIndex === 0 ? "error" : "pending";
  const current = order[phase];
  if (stepIndex < current) return "done";
  if (stepIndex === current) return phase === "done" ? "done" : "active";
  return phase === "done" ? "done" : "pending";
}

export function UnshieldTimeline({
  phase,
  errorStep,
  unwrapTx,
  finalizeTx,
}: {
  phase: UnshieldPhase;
  errorStep?: number;
  unwrapTx: string | null;
  finalizeTx: string | null;
}) {
  const chainId = useChainId();
  if (phase === "idle") return null;

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        let state = stepState(i, phase);
        if (phase === "error" && errorStep !== undefined) {
          state = i < errorStep ? "done" : i === errorStep ? "error" : "pending";
        }
        const txHash = step.id === "request" ? unwrapTx : step.id === "finalize" ? finalizeTx : null;
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute left-[9px] top-6 h-[calc(100%-16px)] w-px ${
                  state === "done" ? "bg-[var(--good)]" : "bg-[var(--line)]"
                }`}
              />
            )}
            <span
              className={`mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[10px] ${
                state === "done"
                  ? "border-[var(--good)] bg-[color-mix(in_srgb,var(--good)_15%,transparent)] text-[var(--good)]"
                  : state === "active"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : state === "error"
                      ? "border-[var(--bad)] text-[var(--bad)]"
                      : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {state === "done" ? "✓" : state === "error" ? "✕" : i + 1}
            </span>
            {state === "active" && (
              <span className="absolute left-0 top-1 h-[22px] w-[22px] animate-ping rounded-full border border-[var(--accent)] opacity-30" />
            )}
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  state === "pending" ? "text-[var(--muted)]" : "text-[var(--text)]"
                }`}
              >
                {step.title}
                {state === "active" && <span className="ml-2 text-xs text-[var(--accent)]">in progress…</span>}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{step.hint}</p>
              {txHash && (
                <a
                  href={txUrl(chainId, txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-mono text-[11px] text-[var(--accent)] hover:underline"
                >
                  {txHash.slice(0, 14)}… ↗
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
