import { sepolia as viemSepolia } from "viem/chains";
import { sepolia as zamaSepolia } from "@zama-fhe/sdk/chains";
import { DefaultRegistryAddresses } from "@zama-fhe/sdk";
import type { Address } from "viem";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const chain = viemSepolia;
export const fheChain = zamaSepolia;
export const CHAIN_ID = viemSepolia.id;

export const REGISTRY_ADDRESS: Address | undefined =
  DefaultRegistryAddresses[CHAIN_ID];

const EXPLORER = "https://sepolia.etherscan.io";

export function txUrl(hash: string) {
  return `${EXPLORER}/tx/${hash}`;
}

export function addressUrl(address: string) {
  return `${EXPLORER}/address/${address}`;
}
