"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { MAINNET_ID, SEPOLIA_ID, SUPPORTED_CHAIN_IDS, chainName } from "@/lib/chains";

export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || (chainId !== undefined && SUPPORTED_CHAIN_IDS.includes(chainId))) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 text-center">
        <h2 className="font-display text-lg font-semibold">Unsupported network</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cloakroom runs on Ethereum Sepolia (test tokens, faucet) and Ethereum mainnet
          (real assets). Switch to continue.
        </p>
        <div className="mt-5 flex gap-2">
          {[SEPOLIA_ID, MAINNET_ID].map((id) => (
            <button
              key={id}
              onClick={() => switchChain({ chainId: id })}
              disabled={isPending}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold disabled:opacity-60 ${
                id === SEPOLIA_ID
                  ? "bg-[var(--accent)] text-black hover:brightness-110"
                  : "border border-[var(--line)] hover:border-[var(--accent)]"
              }`}
            >
              {chainName(id)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
