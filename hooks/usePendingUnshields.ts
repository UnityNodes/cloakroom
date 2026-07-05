"use client";

import { useQuery } from "@tanstack/react-query";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { loadPendingUnshieldRequest, type PendingUnshieldRequest } from "@zama-fhe/sdk";
import type { PairView } from "@/lib/pairs";

export interface PendingUnshield {
  pair: PairView;
  request: PendingUnshieldRequest;
}

export function usePendingUnshields(pairs: PairView[]) {
  const sdk = useZamaSDK();

  const query = useQuery({
    queryKey: ["pending-unshields", pairs.map((p) => p.confidential.address).join(",")],
    queryFn: async (): Promise<PendingUnshield[]> => {
      const found = await Promise.all(
        pairs.map(async (pair) => {
          const request = await loadPendingUnshieldRequest(sdk.storage, pair.confidential.address);
          return request ? { pair, request } : null;
        }),
      );
      return found.filter((x): x is PendingUnshield => x !== null);
    },
    enabled: pairs.length > 0,
    staleTime: 10_000,
  });

  return {
    pending: query.data ?? [],
    refetch: query.refetch,
  };
}
