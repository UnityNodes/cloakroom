"use client";

import { useState } from "react";
import { WagmiProvider, createConfig as createWagmiConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { web } from "@zama-fhe/sdk/web";
import { chain, fheChain, RPC_URL } from "@/lib/chains";
import { sdkEventBus } from "@/lib/event-bus";
import { ActivityProvider } from "@/lib/activity-store";

const wagmiConfig = createWagmiConfig({
  chains: [chain],
  connectors: [injected()],
  transports: { [chain.id]: http(RPC_URL) },
  ssr: true,
});

const zamaConfig = createZamaConfig({
  chains: [fheChain],
  wagmiConfig,
  relayers: { [fheChain.id]: web() },
  onEvent: (event) => sdkEventBus.emit(event),
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>
          <ActivityProvider>{children}</ActivityProvider>
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
