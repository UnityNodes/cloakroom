"use client";

import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { ZamaSDK } from "@zama-fhe/sdk";
import { CUSTOM_PAIRS } from "@/config/custom-pairs";
import { mergePairs, toPairView, type CustomPairConfig, type PairView } from "@/lib/pairs";

const PAGE_SIZE = 50;

function unresolvedCustomPair(entry: CustomPairConfig, configError: string): PairView {
  return {
    underlying: {
      address: entry.tokenAddress,
      name: "Unknown token",
      symbol: "?",
      decimals: 0,
      totalSupply: 0n,
    },
    confidential: {
      address: entry.confidentialTokenAddress,
      name: "Unknown wrapper",
      symbol: "?",
      decimals: 0,
    },
    isValid: true,
    rate: 1n,
    source: "custom",
    configError,
  };
}

async function resolveCustomPair(sdk: ZamaSDK, entry: CustomPairConfig): Promise<PairView> {
  try {
    const wrapped = sdk.createWrappedToken(entry.confidentialTokenAddress);
    if (!(await wrapped.isWrapper())) {
      return unresolvedCustomPair(entry, "Configured address is not an ERC-7984 wrapper");
    }
    const underlyingToken = sdk.createToken(entry.tokenAddress);
    const [underlying, cName, cSymbol, cDecimals, uName, uSymbol, uDecimals] =
      await Promise.all([
        wrapped.underlying(),
        wrapped.name(),
        wrapped.symbol(),
        wrapped.decimals(),
        underlyingToken.name(),
        underlyingToken.symbol(),
        underlyingToken.decimals(),
      ]);
    if (underlying.toLowerCase() !== entry.tokenAddress.toLowerCase()) {
      return unresolvedCustomPair(
        entry,
        "Wrapper underlying() does not match the configured token address",
      );
    }
    return {
      underlying: {
        address: entry.tokenAddress,
        name: uName,
        symbol: uSymbol,
        decimals: uDecimals,
        totalSupply: 0n,
      },
      confidential: {
        address: entry.confidentialTokenAddress,
        name: cName,
        symbol: cSymbol,
        decimals: cDecimals,
      },
      isValid: true,
      rate: 10n ** BigInt(Math.max(0, uDecimals - cDecimals)),
      source: "custom",
    };
  } catch {
    return unresolvedCustomPair(entry, "Could not read this pair on-chain");
  }
}

export function usePairs() {
  const sdk = useZamaSDK();
  const chainId = useChainId();

  const query = useQuery({
    queryKey: ["registry-pairs", chainId],
    queryFn: async (): Promise<PairView[]> => {
      const first = await sdk.registry.listPairs({ page: 1, pageSize: PAGE_SIZE, metadata: true });
      const items = [...first.items];
      const totalPages = Math.ceil(first.total / PAGE_SIZE);
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await sdk.registry.listPairs({ page, pageSize: PAGE_SIZE, metadata: true });
        items.push(...next.items);
      }
      const registryPairs = items.map(toPairView);
      const customEntries = CUSTOM_PAIRS.filter((entry) => entry.chainId === chainId);
      const customPairs = await Promise.all(
        customEntries.map((entry) => resolveCustomPair(sdk, entry)),
      );
      return mergePairs(registryPairs, customPairs);
    },
    staleTime: 5 * 60_000,
  });

  const pairs = query.data ?? [];
  return {
    pairs,
    validPairs: pairs.filter((p) => p.isValid && !p.configError),
    revokedPairs: pairs.filter((p) => !p.isValid),
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      sdk.registry.refresh();
      return query.refetch();
    },
  };
}
