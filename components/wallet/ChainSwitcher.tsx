"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { MAINNET_ID, SEPOLIA_ID, chainName } from "@/lib/chains";

export function ChainSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="flex rounded-full border border-[var(--line)] bg-[var(--panel)] p-0.5 text-[11px]">
      {[SEPOLIA_ID, MAINNET_ID].map((id) => (
        <button
          key={id}
          onClick={() => switchChain({ chainId: id })}
          disabled={isPending || chainId === id}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            chainId === id
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {chainName(id)}
        </button>
      ))}
    </div>
  );
}
