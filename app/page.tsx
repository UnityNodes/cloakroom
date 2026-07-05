import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";
import { Dashboard } from "@/components/Dashboard";
import { Hero } from "@/components/Hero";
import { REGISTRY_ADDRESS, addressUrl } from "@/lib/chains";
import { shortAddress } from "@/lib/format";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="flex flex-col gap-[3px]">
        <span className="h-[3px] w-5 rounded-sm bg-[var(--accent)]" />
        <span className="h-[3px] w-3.5 rounded-sm bg-[var(--accent)] opacity-70" />
        <span className="h-[3px] w-5 rounded-sm bg-[var(--accent)] opacity-40" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Cloakroom</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <NetworkGuard />
      <header className="sticky top-0 z-40 border-b border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] text-[var(--muted)] sm:inline">
              Ethereum Sepolia
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-10">
        <Hero />
        <Dashboard />
      </main>

      <footer className="border-t border-[var(--line-soft)] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 text-[11px] text-[var(--muted)]">
          <p>
            Every pair on this page is read live from the on-chain wrappers registry
            {REGISTRY_ADDRESS && (
              <>
                {" "}
                <a
                  href={addressUrl(REGISTRY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[var(--accent)] hover:underline"
                >
                  {shortAddress(REGISTRY_ADDRESS)}
                </a>
              </>
            )}
            . Nothing is hardcoded — new registrations appear automatically.
          </p>
          <p>Confidential balances decrypt locally, only for their owner.</p>
        </div>
      </footer>
    </div>
  );
}
