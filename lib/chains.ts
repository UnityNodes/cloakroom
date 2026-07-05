import { mainnet as viemMainnet, sepolia as viemSepolia } from "viem/chains";
import { mainnet as zamaMainnet, sepolia as zamaSepolia } from "@zama-fhe/sdk/chains";
import { DefaultRegistryAddresses } from "@zama-fhe/sdk";
import type { Address } from "viem";

export const CHAINS = [viemSepolia, viemMainnet] as const;
export const FHE_CHAINS = [zamaSepolia, zamaMainnet] as const;

export const SEPOLIA_ID = viemSepolia.id;
export const MAINNET_ID = viemMainnet.id;
export const DEFAULT_CHAIN_ID = SEPOLIA_ID;
export const SUPPORTED_CHAIN_IDS: number[] = CHAINS.map((c) => c.id);

export const RPC_URLS: Record<number, string> = {
  [SEPOLIA_ID]:
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  [MAINNET_ID]:
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
};

const EXPLORERS: Record<number, string> = {
  [SEPOLIA_ID]: "https://sepolia.etherscan.io",
  [MAINNET_ID]: "https://etherscan.io",
};

export function chainName(chainId: number): string {
  return chainId === MAINNET_ID ? "Ethereum" : "Sepolia";
}

export function registryAddress(chainId: number): Address | undefined {
  return DefaultRegistryAddresses[chainId];
}

export function txUrl(chainId: number, hash: string) {
  return `${EXPLORERS[chainId] ?? EXPLORERS[DEFAULT_CHAIN_ID]}/tx/${hash}`;
}

export function addressUrl(chainId: number, address: string) {
  return `${EXPLORERS[chainId] ?? EXPLORERS[DEFAULT_CHAIN_ID]}/address/${address}`;
}
