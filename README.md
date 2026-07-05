# Cloakroom

**Check your tokens into confidentiality.**

Cloakroom is a production-grade frontend for the confidential token wrapper
registry on Ethereum Sepolia. Deposit a public ERC-20 and hold it as an
encrypted ERC-7984 balance that no explorer, indexer or stranger can read —
then decrypt it locally (only you can) or unwrap back to the public token at
any time.

> Live demo: _deploy URL here_ · 3-minute video: _link here_ · X thread: _link here_

## What it does

| Capability | How |
|---|---|
| **Registry viewer (hybrid source)** | Every ERC-20 ⇄ ERC-7984 pair is read live from the on-chain wrappers registry (`0x2f0750…128e`) with paginated `getTokenConfidentialTokenPairsSlice` calls — the registry is the primary source of truth, and when a new pair is registered it appears without a deploy. On top of that, [`config/custom-pairs.ts`](config/custom-pairs.ts) declares custom or dev-only pairs that are validated on-chain and merged in with a "custom" badge (see [Adding a new pair](#adding-a-new-erc-20--erc-7984-pair)). Revoked pairs are shown in a separate section, blocked for wrapping but still open for exits. |
| **Shield (wrap)** | Approve + wrap with an exact-amount approval. Confidential tokens cap at 6 decimals, so for 18-decimal assets the UI previews exactly how much will wrap and how much is refunded — and refuses amounts that would wrap to zero. |
| **Unshield (unwrap)** | The hard part. Unwrapping is asynchronous: request → public decryption by the relayer network → finalize with the decryption proof. Cloakroom renders it as a living four-step timeline, needs two wallet confirmations, and **survives interruption**: close the tab mid-flow and a "Resume and finalize" banner brings you back exactly where you left off. Pending requests are persisted locally and rediscovered on load. |
| **Decrypt balances** | One EIP-712 signature grants a decryption permit covering every confidential token in the registry. Balances render as redacted bars until you decrypt; permits are cached in IndexedDB, so the next session decrypts silently. **Any ERC-7984 token works, not just registered ones**: paste an address into "Decrypt any confidential token", the app verifies the ERC-7984 interface on-chain, and unsupported addresses get a clear error. Looked-up tokens stay in a tracked list. |
| **Faucet** | Mints test underlying tokens (up to 1,000,000 per call). Mintability is probed on-chain per token with `eth_call`, so restricted assets (the non-mock tGBP, steakcUSDC) are excluded automatically — not by a hardcoded list. |

Extras: an activity feed with per-operation status and transaction links, plus a
**developer mode** that streams every SDK event (encrypt, decrypt, each contract
call) for anyone who wants to see what actually happens under the hood.

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Optional `.env.local` (defaults to a public Sepolia RPC):

```bash
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Other commands:

```bash
npm run build         # production build
npm test              # unit tests for amount math (rounding, refunds)
npm run verify:chain  # live checks against Sepolia: registry, metadata, rates, mint probes
```

To try the full loop you need a browser wallet on Sepolia with a little test ETH
([sepoliafaucet options](https://docs.metamask.io/developer-tools/faucet/)):
Faucet → Shield → Decrypt → Unshield, two minutes end to end.

## Architecture

```
app/            Next.js 15 App Router shell and providers
  providers.tsx Wagmi → TanStack Query → FHE SDK provider chain
components/     registry / portfolio / shield / unshield / faucet / activity
hooks/          usePairs, usePendingUnshields, useUnderlyingBalances
lib/            chain config, amount math, error humanization, activity store
scripts/        verify-chain.mjs — live on-chain assumption checks
```

- **Wallet & reads:** wagmi v3 + viem, injected connectors (EIP-6963 discovery,
  no third-party modal service).
- **FHE:** `@zama-fhe/sdk` v3 + its React bindings. FHE WASM runs in a Web
  Worker; decryption permits and pending unwraps persist in IndexedDB. The
  unwrap timeline is driven by the SDK's phase callbacks
  (`onUnwrapSubmitted → onFinalizing → onFinalizeSubmitted`), and interrupted
  flows resume via the persisted unwrap transaction hash.
- **Correctness details worth noting:** `isValid` is respected everywhere
  (revoked wrappers cannot be wrapped into, but exits stay open, because funds
  must never be stranded); wrap amounts below the wrapper rate are blocked in
  the UI because the contract would accept them and mint zero; "Unshield
  everything" operates directly on the encrypted balance handle, so it works
  without decrypting your balance first.
- **Chain-agnostic by construction:** the registry address resolves per chain
  from the SDK's built-in map, so pointing Cloakroom at Ethereum mainnet is a
  one-line chain-config change.

## Adding a new ERC-20 ⇄ ERC-7984 pair

There are two paths, by design:

**1. On-chain registration (canonical).** Pairs registered in the official
Wrappers Registry appear in Cloakroom automatically — the app re-reads the
registry with pagination and never hardcodes a token list. This already
happened during development: a ninth pair (`steakcUSDC`) was registered after
the project started and showed up with zero code changes. If you control a
wrapper that belongs in the canonical set, register it with the registry owner
and every Cloakroom deployment picks it up.

**2. Local config (custom / dev pairs).** For wrappers that are not (yet) in
the registry — your own deployment, a staging token — add one entry to
[`config/custom-pairs.ts`](config/custom-pairs.ts):

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
chain — the wrapper must pass the ERC-7984 wrapper interface check (ERC-165)
and its `underlying()` must match `tokenAddress` — then fetches metadata and
renders the pair with a **custom** badge. Wrap, unwrap, decryption and the
activity feed work identically to registry pairs. Misconfigured entries are
surfaced in the list as **config error** rows with actions disabled and the
reason in the tooltip, so a typo never silently hides a pair. If a custom pair
later gets registered on-chain, the registry version wins and the config entry
is ignored (dedupe by wrapper address) — safe to leave in place.

For one-off balance checks of a confidential token you do not want to add as a
pair, use "Decrypt any confidential token" instead — no config required.

## Verification

`npm run verify:chain` asserts against live Sepolia that: the SDK's default
registry matches the documented address, every pair's wrapper reports the
paired underlying, confidential decimals are capped at 6, `rate` equals
`10^(decimals-6)`, the `UnwrapRequested` topic matches the SDK's, and probes
which underlying tokens are publicly mintable. Run it before deploying — if
the testnet contracts move, it fails loudly.

## Deploy

Standard Next.js on Vercel: import the repo, set `NEXT_PUBLIC_RPC_URL`
(recommended: an Alchemy/Infura Sepolia endpoint to avoid public RPC rate
limits), deploy. No other configuration.
