import { createPublicClient, http, parseAbi, parseAbiItem, keccak256, toHex } from "viem";
import { sepolia } from "viem/chains";

const REGISTRY = "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";
const RPC = process.env.RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const PROBE_FROM = "0x000000000000000000000000000000000000dEaD";

const client = createPublicClient({ chain: sepolia, transport: http(RPC) });

const registryAbi = parseAbi([
  "function getTokenConfidentialTokenPairsLength() view returns (uint256)",
  "function getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex) view returns ((address tokenAddress, address confidentialTokenAddress, bool isValid)[])",
]);

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
]);

const wrapperAbi = parseAbi([
  "function rate() view returns (uint256)",
  "function underlying() view returns (address)",
]);

const unwrapRequestedEvent = parseAbiItem(
  "event UnwrapRequested(address indexed receiver, bytes32 indexed unwrapRequestId, bytes32 amount)",
);

let failures = 0;
function check(condition, label) {
  if (condition) {
    console.log(`  OK  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`);
  }
}

console.log(`RPC: ${RPC}`);

const sdk = await import("@zama-fhe/sdk").catch((error) => {
  console.log(`note: @zama-fhe/sdk not importable in node: ${error.message}`);
  return null;
});

if (sdk) {
  check(
    sdk.DefaultRegistryAddresses?.[sepolia.id]?.toLowerCase() === REGISTRY.toLowerCase(),
    `SDK default registry matches bounty registry (${REGISTRY})`,
  );
  const localTopic = keccak256(toHex("UnwrapRequested(address,bytes32,bytes32)"));
  const sdkTopics = Array.isArray(sdk.TOKEN_TOPICS) ? sdk.TOKEN_TOPICS : Object.values(sdk.TOKEN_TOPICS ?? {});
  check(
    sdkTopics.some((t) => String(t).toLowerCase() === localTopic.toLowerCase()),
    `UnwrapRequested topic ${localTopic} is among SDK TOKEN_TOPICS`,
  );
}

const length = await client.readContract({
  address: REGISTRY,
  abi: registryAbi,
  functionName: "getTokenConfidentialTokenPairsLength",
});
console.log(`pairs length: ${length}`);
check(length >= 8n, "registry has at least the 8 documented pairs");

const pairs = await client.readContract({
  address: REGISTRY,
  abi: registryAbi,
  functionName: "getTokenConfidentialTokenPairsSlice",
  args: [0n, length],
});

for (const pair of pairs) {
  const calls = [
    { address: pair.tokenAddress, abi: erc20Abi, functionName: "symbol" },
    { address: pair.tokenAddress, abi: erc20Abi, functionName: "decimals" },
    { address: pair.confidentialTokenAddress, abi: erc20Abi, functionName: "symbol" },
    { address: pair.confidentialTokenAddress, abi: erc20Abi, functionName: "decimals" },
    { address: pair.confidentialTokenAddress, abi: wrapperAbi, functionName: "rate" },
    { address: pair.confidentialTokenAddress, abi: wrapperAbi, functionName: "underlying" },
  ];
  const [symbol, decimals, cSymbol, cDecimals, rate, underlying] = (
    await client.multicall({ contracts: calls })
  ).map((r) => r.result);

  console.log(
    `- ${String(symbol).padEnd(10)} -> ${String(cSymbol).padEnd(11)} valid=${pair.isValid} dec=${decimals}/${cDecimals} rate=${rate}`,
  );
  check(cDecimals <= 6, `${cSymbol}: confidential decimals capped at 6`);
  check(
    underlying?.toLowerCase() === pair.tokenAddress.toLowerCase(),
    `${cSymbol}: wrapper.underlying() matches registry tokenAddress`,
  );
  const expectedRate = decimals > 6 ? 10n ** BigInt(decimals - 6) : 1n;
  check(rate === expectedRate, `${cSymbol}: rate ${rate} == 10^(decimals-6)`);

  let mintable = false;
  try {
    await client.simulateContract({
      address: pair.tokenAddress,
      abi: erc20Abi,
      functionName: "mint",
      args: [PROBE_FROM, 1n],
      account: PROBE_FROM,
    });
    mintable = true;
  } catch {
    mintable = false;
  }
  console.log(`    mint probe: ${mintable ? "public" : "restricted"}`);
}

const latest = await client.getBlockNumber();
let events = [];
const validWrappers = pairs.filter((p) => p.isValid).map((p) => p.confidentialTokenAddress);
try {
  events = await client.getLogs({
    address: validWrappers,
    event: unwrapRequestedEvent,
    fromBlock: latest - 19_999n,
    toBlock: latest,
  });
  console.log(`UnwrapRequested events found in last 20k blocks: ${events.length}`);
} catch (error) {
  console.log(`note: log scan unavailable on this RPC tier: ${error.shortMessage ?? error.message}`);
}
if (events.length > 0) {
  const ev = events[0];
  console.log(
    `  sample: wrapper=${ev.address} receiver=${ev.args.receiver} requestId=${ev.args.unwrapRequestId?.slice(0, 18)}… amountHandle=${ev.args.amount?.slice(0, 18)}…`,
  );
  check(Boolean(ev.args.unwrapRequestId && ev.args.amount), "event decodes with requestId and amount handle");
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
