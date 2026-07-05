import { parseAbi } from "viem";

export const mintAbi = parseAbi([
  "function mint(address to, uint256 amount)",
]);

export const FAUCET_CAP_TOKENS = 1_000_000n;

export const FAUCET_PRESETS = [100n, 1_000n, 10_000n, 1_000_000n];
