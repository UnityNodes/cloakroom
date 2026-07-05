"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAddress, type Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { NoCiphertextError } from "@zama-fhe/sdk";
import { humanizeError, rawErrorText, UnsupportedTokenError } from "@/lib/errors";
import { formatAmount, shortAddress } from "@/lib/format";
import { addressUrl } from "@/lib/chains";
import { useActivity } from "@/lib/activity-store";
import { RedactedValue } from "./RedactedValue";

const TRACKED_KEY = "cloakroom.tracked.v1";
const TRACKED_CAP = 10;

interface LookupResult {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint | null;
}

function loadTracked(): Address[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRACKED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, TRACKED_CAP) : [];
  } catch {
    return [];
  }
}

export function DecryptAnyToken() {
  const sdk = useZamaSDK();
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { addEntry, updateEntry } = useActivity();
  const [input, setInput] = useState("");
  const [tracked, setTracked] = useState<Address[]>([]);
  const [results, setResults] = useState<Record<string, LookupResult>>({});

  useEffect(() => {
    setTracked(loadTracked());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TRACKED_KEY, JSON.stringify(tracked.slice(0, TRACKED_CAP)));
    } catch {
      void 0;
    }
  }, [tracked]);

  const lookup = useMutation({
    mutationFn: async (raw: string): Promise<LookupResult> => {
      const address = raw.trim() as Address;
      if (!isAddress(address)) throw new UnsupportedTokenError(address || "(empty)");
      const token = sdk.createToken(address);
      const confidential = await token.isConfidential().catch(() => false);
      if (!confidential) throw new UnsupportedTokenError(address);
      const [name, symbol, decimals] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
      ]);
      let balance: bigint | null = null;
      if (isConnected && account) {
        const id = `decrypt-any-${address}-${Date.now()}`;
        addEntry({ id, kind: "decrypt", label: `Decrypt ${symbol} balance`, status: "pending", chainId });
        try {
          await sdk.permits.grantPermit([address]);
          balance = await token.balanceOf(account).catch((error) => {
            if (error instanceof NoCiphertextError) return 0n;
            throw error;
          });
          updateEntry(id, { status: "success", detail: "Decrypted" });
        } catch (error) {
          updateEntry(id, { status: "error", detail: humanizeError(error) });
          throw error;
        }
      }
      return { address, name, symbol, decimals, balance };
    },
    onSuccess: (result) => {
      setResults((prev) => ({ ...prev, [result.address.toLowerCase()]: result }));
      setTracked((prev) => {
        const without = prev.filter((a) => a.toLowerCase() !== result.address.toLowerCase());
        return [result.address, ...without].slice(0, TRACKED_CAP);
      });
      setInput("");
    },
  });

  const untrack = (address: Address) => {
    setTracked((prev) => prev.filter((a) => a.toLowerCase() !== address.toLowerCase()));
    setResults((prev) => {
      const next = { ...prev };
      delete next[address.toLowerCase()];
      return next;
    });
  };

  return (
    <section className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow mb-1.5">Annex · Off-registry</p>
          <p className="text-sm font-medium">Declassify any confidential token</p>
          <p className="text-xs text-[var(--muted)]">
            Paste any ERC-7984 token address, registered here or not, and read your
            balance.
          </p>
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!lookup.isPending && input.trim()) lookup.mutate(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… token address"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2 font-mono text-xs outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={lookup.isPending || !input.trim()}
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-40"
        >
          {lookup.isPending ? "Checking…" : isConnected ? "Declassify" : "Look up"}
        </button>
      </form>

      {lookup.isError && (
        <div className="mt-3 rounded-md border border-[color-mix(in_srgb,var(--classified)_40%,transparent)] bg-[var(--classified-soft)] p-3 text-xs">
          <p>{humanizeError(lookup.error)}</p>
          <details className="mt-1 text-[var(--muted)]">
            <summary className="cursor-pointer">details</summary>
            <p className="mt-1 break-all font-mono">{rawErrorText(lookup.error)}</p>
          </details>
        </div>
      )}

      {tracked.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tracked.map((address) => {
            const result = results[address.toLowerCase()];
            return (
              <li
                key={address}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {result ? `${result.symbol}` : "Tracked token"}
                    {result && (
                      <span className="ml-2 text-[11px] font-normal text-[var(--muted)]">
                        {result.name}
                      </span>
                    )}
                  </p>
                  <a
                    href={addressUrl(chainId, address)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-[var(--muted)] hover:text-[var(--accent)]"
                  >
                    {shortAddress(address)}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {result?.balance !== null && result?.balance !== undefined ? (
                    <RedactedValue
                      revealed
                      value={formatAmount(result.balance, result.decimals)}
                    />
                  ) : (
                    <button
                      onClick={() => lookup.mutate(address)}
                      disabled={lookup.isPending}
                      className="rounded-md border border-[var(--line)] px-2.5 py-1 text-[11px] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                      title={isConnected ? "Decrypt balance" : "Connect a wallet to decrypt"}
                    >
                      {isConnected ? "declassify" : "connect first"}
                    </button>
                  )}
                  <button
                    onClick={() => untrack(address)}
                    className="text-[var(--muted)] hover:text-[var(--bad)]"
                    title="Remove from tracked tokens"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
