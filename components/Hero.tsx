"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const REDACTED = "▓▓▓▓▓▓▓▓▓▓▓▓▓▓";

export function Hero() {
  const { isConnected } = useAccount();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (isConnected) return null;

  return (
    <section className="fade-up mb-12 max-w-3xl">
      <p className="eyebrow mb-3">Confidential token wrappers · ERC-7984</p>
      <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">
        Check your tokens into{" "}
        <span
          className={`inline-block align-baseline transition-all duration-500 ${
            revealed ? "" : "text-[var(--accent)]"
          }`}
          aria-label="confidentiality"
        >
          {revealed ? (
            <span className="[animation:reveal_.6s_ease]">confidentiality.</span>
          ) : (
            <span className="font-mono text-[0.85em] tracking-tight text-[var(--panel-2)] [text-shadow:none]" style={{ WebkitTextStroke: "1px var(--line)" }}>
              {REDACTED}
            </span>
          )}
        </span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Deposit a public ERC-20 and hold it as an encrypted balance no explorer can read.
        Wrap, unwrap and decrypt — every pair below comes straight from the on-chain
        registry. Grab test tokens from the faucet and try the whole loop in two minutes.
      </p>
    </section>
  );
}
