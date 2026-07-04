"use client";

import { useQuery } from "@tanstack/react-query";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { CHAIN_ID } from "@/lib/chains";
import { toPairView, type PairView } from "@/lib/pairs";

const PAGE_SIZE = 50;

export function usePairs() {
  const sdk = useZamaSDK();

  const query = useQuery({
    queryKey: ["registry-pairs", CHAIN_ID],
    queryFn: async (): Promise<PairView[]> => {
      const first = await sdk.registry.listPairs({ page: 1, pageSize: PAGE_SIZE, metadata: true });
      const items = [...first.items];
      const totalPages = Math.ceil(first.total / PAGE_SIZE);
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await sdk.registry.listPairs({ page, pageSize: PAGE_SIZE, metadata: true });
        items.push(...next.items);
      }
      return items.map(toPairView);
    },
    staleTime: 5 * 60_000,
  });

  const pairs = query.data ?? [];
  return {
    pairs,
    validPairs: pairs.filter((p) => p.isValid),
    revokedPairs: pairs.filter((p) => !p.isValid),
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      sdk.registry.refresh();
      return query.refetch();
    },
  };
}
