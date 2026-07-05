# Cloakroom

**Check your tokens into confidentiality.**

Cloakroom is a frontend for the confidential token wrapper registry on Ethereum.
Deposit a public ERC-20 and hold it as an encrypted ERC-7984 balance no explorer
can read. Decrypt it locally when you want (only you can), or unwrap back to the
public token any time.

> Live demo: _deploy URL here_ · 3-minute video: _link here_ · X thread: _link here_

**Networks.** Ethereum Sepolia has the full feature set including the faucet.
Ethereum mainnet has the registry, wrap/unwrap and decryption (real assets, no
faucet). The header switcher works before and after connecting, and the registry
address resolves per chain on its own.

## What it does

| Capability | How |
|---|---|
| **Registry (hybrid source)** | Every ERC-20 ⇄ ERC-7984 pair is read live from the on-chain registry (`0x2f0750…128e`) with paginated `getTokenConfidentialTokenPairsSlice` calls. The registry is the source of truth: register a new pair and it shows up with no deploy. On top of that, [`config/custom-pairs.ts`](config/custom-pairs.ts) lets you declare custom or dev-only pairs; they are validated on-chain and merged in with a "custom" badge. Revoked pairs sit in their own section, blocked for wrapping but still open for exits. |
| **Shield (wrap)** | Approve, then wrap, with an exact-amount approval. Confidential tokens cap at 6 decimals, so for 18-decimal assets the UI shows exactly how much wraps and how much comes back, and blocks amounts that would wrap to zero. |
| **Unshield (unwrap)** | The hard part. Unwrapping is asynchronous: request, then public decryption by the relayer, then finalize with the proof. Cloakroom shows it as a live four-step timeline and needs two wallet confirmations. It survives interruption: close the tab mid-flow and a "Resume and finalize" banner brings you back where you left off. Pending requests persist locally and are found again on load. |
| **Decrypt balances** | One EIP-712 signature covers every confidential token in the registry. Balances render as redacted bars until you decrypt; permits cache in IndexedDB, so the next visit decrypts silently. Any ERC-7984 token works, not just registered ones: paste an address, the app checks the ERC-7984 interface on-chain, and unsupported addresses get a clear error. Looked-up tokens stay in a tracked list. |
| **Faucet** | Mints test tokens (up to 1,000,000 per call). Mintability is probed on-chain per token, so restricted assets (the non-mock tGBP, steakcUSDC) drop out on their own, not by a hardcoded list. |

There is also an activity feed with per-operation status and transaction links,
and a developer mode that streams every SDK event (encrypt, decrypt, each
contract call) if you want to watch what the app actually does.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Optional `.env.local` (defaults to public RPCs):

```bash
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com
```

Other commands:

```bash
npm run build         # production build
npm test              # amount math (rounding, refunds)
npm run verify:chain  # live Sepolia checks: registry, metadata, rates, mint probes
```

To try the full loop you need a browser wallet on Sepolia with a little test ETH.
Faucet, Shield, Decrypt, Unshield takes about two minutes end to end.

## Architecture

```
app/            Next.js 15 App Router shell and providers
  providers.tsx Wagmi, TanStack Query, FHE SDK provider chain
components/     registry / portfolio / shield / unshield / faucet / activity
hooks/          usePairs, usePendingUnshields, useUnderlyingBalances
lib/            chain config, amount math, error humanization, activity store
scripts/        verify-chain.mjs, live on-chain assumption checks
```

- **Wallet and reads:** wagmi v3 and viem, injected connectors (EIP-6963
  discovery, no third-party modal service).
- **FHE:** `@zama-fhe/sdk` v3 and its React bindings. The FHE WASM runs in a Web
  Worker; permits and pending unwraps persist in IndexedDB. The unwrap timeline
  is driven by the SDK phase callbacks (`onUnwrapSubmitted`, `onFinalizing`,
  `onFinalizeSubmitted`), and interrupted flows resume from the saved unwrap
  transaction hash.
- **Correctness:** `isValid` is respected everywhere. Revoked wrappers cannot be
  wrapped into, but exits stay open so funds are never stranded. Wrap amounts
  below the wrapper rate are blocked, because the contract would accept them and
  mint zero. "Unshield everything" runs on the encrypted balance handle, so it
  works without decrypting your balance first.
- **Chain-agnostic:** the registry address resolves per chain from the SDK map,
  so mainnet is a config value, not a rewrite.

## Adding a new pair

Two paths, by design.

**On-chain (canonical).** Pairs registered in the official Wrappers Registry
show up in Cloakroom on their own; the app re-reads the registry with pagination
and never hardcodes a token list. This happened during development: a ninth pair
(`steakcUSDC`) was registered after we started and appeared with zero code
changes. If you own a wrapper that belongs in the canonical set, register it with
the registry owner and every Cloakroom deployment picks it up.

**Local config (custom or dev pairs).** For wrappers not in the registry yet, add
one entry to [`config/custom-pairs.ts`](config/custom-pairs.ts):

```ts
export const CUSTOM_PAIRS: CustomPairConfig[] = [
  {
    chainId: 11155111,
    tokenAddress: "0xYourERC20Address",
    confidentialTokenAddress: "0xYourERC7984WrapperAddress",
  },
];
```

That is the whole process. On load, Cloakroom validates the entry against the
chain: the wrapper must pass the ERC-7984 interface check (ERC-165) and its
`underlying()` must match `tokenAddress`. It then fetches metadata and renders the
pair with a **custom** badge. Wrap, unwrap, decryption and the activity feed work
just like registry pairs. A bad entry shows up as a **config error** row with
actions disabled and the reason in the tooltip, so a typo never silently hides a
pair. If a custom pair later gets registered on-chain, the registry version wins
(dedupe by wrapper address), so it is safe to leave in place.

For a one-off balance check of a token you do not want to add as a pair, use
"Decrypt any confidential token" instead. No config needed.

## Verification

`npm run verify:chain` checks against live Sepolia that the SDK default registry
matches the documented address, every wrapper reports its paired underlying,
confidential decimals cap at 6, `rate` equals `10^(decimals-6)`, the
`UnwrapRequested` topic matches the SDK, and which underlyings are publicly
mintable. Run it before deploying. If the testnet contracts move, it fails loudly.

Deployment steps and the production checklist live in [docs/DEPLOY.md](docs/DEPLOY.md).
