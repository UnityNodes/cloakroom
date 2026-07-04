"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/chains";

export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === CHAIN_ID) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 text-center">
        <h2 className="text-lg font-semibold">Wrong network</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cloakroom runs on Ethereum Sepolia. Switch your wallet to continue.
        </p>
        <button
          onClick={() => switchChain({ chainId: CHAIN_ID })}
          disabled={isPending}
          className="mt-5 w-full rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Switching…" : "Switch to Sepolia"}
        </button>
      </div>
    </div>
  );
}
