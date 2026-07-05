"use client";

import { useChainId } from "wagmi";
import { addressUrl, registryAddress } from "@/lib/chains";
import { shortAddress } from "@/lib/format";

export function RegistryFooter() {
  const chainId = useChainId();
  const registry = registryAddress(chainId);

  return (
    <footer className="border-t border-[var(--line-soft)] py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 text-[11px] text-[var(--muted)]">
        <p>
          Every pair on this page is read live from the on-chain wrappers registry
          {registry && (
            <>
              {" "}
              <a
                href={addressUrl(chainId, registry)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[var(--accent)] hover:underline"
              >
                {shortAddress(registry)}
              </a>
            </>
          )}
          , plus optional local config entries. New registrations appear automatically.
        </p>
        <p>Confidential balances decrypt locally, only for their owner.</p>
      </div>
    </footer>
  );
}
