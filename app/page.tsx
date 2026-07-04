import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="min-h-screen">
      <NetworkGuard />
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">Cloakroom</span>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
              Sepolia
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Dashboard />
      </main>
    </div>
  );
}
