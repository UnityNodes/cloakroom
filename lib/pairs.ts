import type { Address } from "viem";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";

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
