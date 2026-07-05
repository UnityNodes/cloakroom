"use client";

import { useAccount, useChainId } from "wagmi";
import { chainName, registryAddress } from "@/lib/chains";
import { usePairs } from "@/hooks/usePairs";
import { fileNumber, shortAddress } from "@/lib/format";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--panel)] px-4 py-2.5">
      <p className="ref mb-0.5 text-[9px]">{label}</p>
      <p className="font-mono text-xs text-[var(--text)]">{value}</p>
    </div>
  );
}

export function Masthead() {
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { pairs, isLoading } = usePairs();
  const registry = registryAddress(chainId);
  const network = chainName(chainId);

  return (
    <section className="fade-up relative mb-9">
      {registry && (
        <div aria-hidden className="absolute right-0 top-0 hidden flex-col items-end gap-1 lg:flex">
          <div
            className="h-7 w-40 opacity-45"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--text) 0 1px, transparent 1px 3px, var(--text) 3px 5px, transparent 5px 8px, var(--text) 8px 9px, transparent 9px 12px)",
            }}
          />
          <span className="ref text-[9px]">REF {fileNumber(registry)}</span>
        </div>
      )}

      <p className="classline mb-5">
        <span>Confidential</span>
        <span className="text-[var(--accent)]">Asset Wrapper Registry</span>
        <span>{network}</span>
      </p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-semibold leading-[1.12] sm:text-4xl">
            Check your tokens into{" "}
            <span className="glow-gild font-mono text-[0.86em] font-medium">
              confidentiality
            </span>
            .
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Browse the official ERC-20 ⇄ ERC-7984 pairs, wrap into a balance no explorer can
            read, and declassify it only for yourself. Every file below is pulled live from
            the on-chain registry.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line-soft)] sm:grid-cols-4 lg:min-w-[26rem]">
          <MetaField
            label="Registry file"
            value={registry ? fileNumber(registry) : "·"}
          />
          <MetaField label="Network" value={network} />
          <MetaField label="On record" value={isLoading ? "····" : `${pairs.length} pairs`} />
          <MetaField
            label="Clearance"
            value={isConnected && address ? shortAddress(address) : "awaiting sign-in"}
          />
        </div>
      </div>
    </section>
  );
}
