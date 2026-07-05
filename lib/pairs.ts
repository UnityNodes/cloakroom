import type { Address } from "viem";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";

export type PairSource = "registry" | "custom";

export interface CustomPairConfig {
  chainId: number;
  tokenAddress: Address;
  confidentialTokenAddress: Address;
}

export interface PairView {
  underlying: {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  };
  confidential: {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
  };
  isValid: boolean;
  rate: bigint;
  source: PairSource;
  configError?: string;
}

export function mergePairs(registry: PairView[], custom: PairView[]): PairView[] {
  const known = new Set(registry.map((p) => p.confidential.address.toLowerCase()));
  const additions = custom.filter(
    (p) => !known.has(p.confidential.address.toLowerCase()),
  );
  return [...registry, ...additions];
}

export function toPairView(pair: TokenWrapperPairWithMetadata): PairView {
  const rateExponent = Math.max(0, pair.underlying.decimals - pair.confidential.decimals);
  return {
    underlying: {
      address: pair.tokenAddress,
      name: pair.underlying.name,
      symbol: pair.underlying.symbol,
      decimals: pair.underlying.decimals,
      totalSupply: pair.underlying.totalSupply,
    },
    confidential: {
      address: pair.confidentialTokenAddress,
      name: pair.confidential.name,
      symbol: pair.confidential.symbol,
      decimals: pair.confidential.decimals,
    },
    isValid: pair.isValid,
    rate: 10n ** BigInt(rateExponent),
    source: "registry",
  };
}

export function pairMatches(pair: PairView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    pair.underlying.symbol,
    pair.underlying.name,
    pair.underlying.address,
    pair.confidential.symbol,
    pair.confidential.name,
    pair.confidential.address,
  ].some((field) => field.toLowerCase().includes(q));
}
