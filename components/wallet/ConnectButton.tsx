"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--good)]" />
          <span className="font-mono">{shortAddress(address)}</span>
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-xl">
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  const available = connectors.filter((c) => c.type !== "injected" || connectors.length === 1);
  const list = available.length > 0 ? available : connectors;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:brightness-110 transition-all disabled:opacity-60"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-xl">
          {list.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">
              No browser wallet detected. Install MetaMask or Rabby, then reload.
            </p>
          )}
          {list.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--panel-2)]"
            >
              {connector.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={connector.icon} alt="" className="h-5 w-5 rounded" />
              )}
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
