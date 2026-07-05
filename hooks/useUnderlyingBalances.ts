"use client";

import { erc20Abi, type Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import type { PairView } from "@/lib/pairs";

export function useUnderlyingBalances(pairs: PairView[]) {
  const { address } = useAccount();

  const query = useReadContracts({
    contracts: pairs.map((pair) => ({
      address: pair.underlying.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address ?? "0x0000000000000000000000000000000000000000"] as const,
    })),
    query: { enabled: Boolean(address) && pairs.length > 0 },
  });

  const balances = new Map<Address, bigint>();
  if (query.data) {
    query.data.forEach((result, i) => {
      if (result.status === "success") {
        balances.set(pairs[i].underlying.address, result.result as bigint);
      }
    });
  }

  return { balances, isLoading: query.isLoading, refetch: query.refetch };
}
