# Cloakroom — Confidential Wrapper Registry App (Design Spec)

Date: 2026-07-04
Status: approved for implementation (autonomous session; spec derived from the full bounty brief provided by Oleksiy)
Target: Zama Bounty Track Season 3, deadline 2026-07-07 23:59 AoE

## 1. Product

Cloakroom is a coat-check for tokens: deposit a public ERC-20, receive a
confidential ERC-7984 balance; hand the ticket back to exit. It is a
production-grade frontend over contracts already deployed on Sepolia.
No custom smart contracts. The project name intentionally contains no
vendor branding (hard disqualification rule).

Four capabilities, all dynamic against the on-chain registry
`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`:

1. Registry viewer: every ERC-20 <-> ERC-7984 pair, paginated reads,
   revoked pairs shown separately with a badge and blocked for wrap.
2. Wrap (shield): approve + wrap with 6-decimal rounding preview,
   refund display, and a guard against amounts below the wrapper rate
   (contract accepts them and mints 0 - the UI must not allow that).
3. Unwrap (unshield): the async two-phase flow with a persistent,
   resumable step timeline. This is the UX centerpiece.
4. Balance decryption: EIP-712 permit-based user decryption, batched
   across all tokens with a single signature, cached so repeat decrypts
   are silent. Plus a faucet for the mock underlying tokens.

## 2. Judged criteria mapped to design bets

- UX/frontend quality: the unshield timeline (Requested -> Decrypting ->
  Finalizing -> Done) survives page reloads via SDK pending-unshield
  persistence and `resumeUnshield`. Encrypted values render as redacted
  bars that animate into cleartext on decryption.
- Coverage: zero hardcoded token lists. Pairs, metadata, validity all
  come from the registry at runtime; new registrations appear without a
  deploy. Faucet capability is probed via `eth_call` simulation, not a
  hardcoded allowlist, so the restricted ctGBP underlying is excluded
  automatically.
- Correctness: `isValid` respected everywhere; revoked pairs cannot be
  wrapped but can still be unwrapped (funds must never be stranded),
  with a warning banner.
- Real-world viability: portfolio view, human error messages mapped from
  the SDK error taxonomy, loading skeletons, empty states, Etherscan
  links, responsive layout.

## 3. Stack (decision)

Next.js 15 App Router + React 19 + TypeScript + Tailwind v4.
wagmi v2 + viem for wallet and generic contract IO (faucet, allowance
watches). @zama-fhe/sdk 3.2.0 + @zama-fhe/react-sdk 3.2.0 for all FHE
and wrapper flows. TanStack Query v5 (peer dep, also wagmi's cache).
Deploy: Vercel. RPC: public Sepolia endpoint by default,
NEXT_PUBLIC_RPC_URL override.

Alternatives considered:
- Fork fhevm-react-template: rejected. It is a contracts+frontend
  monorepo (Foundry, deploy scripts, daisyUI) - wrong shape for a
  no-contracts product app, and its look is recognizably template.
- Legacy @zama-fhe/relayer-sdk 0.4.x directly: rejected. The v3 SDK
  wraps it with exactly the primitives this bounty needs (see 4);
  reimplementing them would add risk, not points.
- Wallet UI: custom connect flow over wagmi EIP-6963 injected connector
  discovery. No WalletConnect project id dependency; judges use browser
  wallets. RainbowKit rejected: generic look, extra dependency surface.

## 4. Why @zama-fhe/sdk v3 (verified against package typings 3.2.0)

The SDK ships, verified in dist typings, not docs summaries:
- `WrappersRegistry` with `listPairs({ page, pageSize, metadata })`,
  chain-keyed default registry addresses, 24h cache + `refresh()`.
- `WrappedToken.shield(amount, { approvalStrategy, callbacks })` -
  ERC-1363 single-tx path or approve+wrap fallback, ERC-20 balance
  preflight, USDT-style approve-reset handling.
- `WrappedToken.unshield(amount, callbacks)` orchestrating
  unwrap -> receipt -> `UnwrapRequested` parse -> publicDecrypt ->
  `finalizeUnwrap`, with `onUnwrapSubmitted/onFinalizing/
  onFinalizeSubmitted` callbacks driving our timeline UI.
- `resumeUnshield(unwrapTxHash)` + `loadPendingUnshieldRequest` for
  reload recovery; pending state persisted in our IndexedDB storage.
- `Token.batchBalancesOf` / `useConfidentialBalances` - all balances
  decrypted after one `grantPermit` EIP-712 signature (permits chunked
  at 10 contracts/signature, cached in IndexedDB, idempotent).
- Error taxonomy (`NoCiphertextError`, `InsufficientERC20BalanceError`,
  `SigningRejectedError`, `AclPausedError`, ...) + `matchZamaError` for
  human-readable error mapping.
- `onEvent` unified event stream (encrypt/decrypt/tx phases) - powers
  the Activity feed and a developer mode showing real contract calls.
- `web()` relayer: FHE WASM in a Web Worker via CDN - no Next.js
  bundler surgery for WASM.

Faucet is the one flow outside the SDK: plain wagmi `writeContract`
`mint(address,uint256)` on mock underlying tokens, 1,000,000-token cap
per call enforced in UI, `simulateContract` probe to auto-detect
mintability per token.

## 5. Architecture

```
app/                    Next.js App Router, single-page product
  layout.tsx            fonts, providers, shell
  page.tsx              dashboard composition
  providers.tsx         Wagmi -> QueryClient -> ZamaProvider (client)
components/
  wallet/               connect button, account chip, network guard
  registry/             pairs table, pair row, revoked section, search
  portfolio/            balance cards, redacted value, decrypt-all CTA
  shield/               wrap panel: amount input, rate preview, steps
  unshield/             unwrap panel: amount input, timeline, resume
  faucet/               token picker, amount presets, mint button
  activity/             event feed drawer, developer mode toggle
  ui/                   primitives: buttons, cards, skeletons, toasts
lib/
  chains.ts             chain config, RPC resolution, explorer URLs
  zama.ts               ZamaConfig factory (wagmi glue, web relayer,
                        IndexedDB storage, onEvent -> activity store)
  faucet.ts             mint ABI, cap constant, mintability probe
  format.ts             bigint <-> display amount, rate math, floors
  errors.ts             matchZamaError -> human message table
  activity-store.ts     zustand-free: React context + localStorage log
hooks/
  usePairs.ts           registry pages -> single flat list + validity
  useMintable.ts        simulateContract probe per underlying
  usePendingUnshields.ts  loadPendingUnshieldRequest scan across pairs
```

Data flow: wagmi supplies wallet + transport; ZamaProvider (react-sdk)
receives the wagmi config via `@zama-fhe/react-sdk/wagmi` createConfig;
react-sdk hooks feed TanStack Query caches; UI components stay dumb and
render query states. Shield/unshield mutations run through SDK token
objects; their callbacks dispatch to the activity store, which the
timeline and feed render. Faucet writes go through plain wagmi.

## 6. UX decisions

- Single dashboard, no routing maze: registry table center, portfolio
  above it, action panel slides in per pair (Shield / Unshield / Faucet
  tabs). A judge reaches every feature in one click.
- Unshield timeline states: Submitted -> Awaiting decryption ->
  Finalizing -> Complete, each with tx hash links; on reload, pending
  requests resurface as a "Resume" banner on the pair and in the
  portfolio. Failure at any step keeps the state and offers retry.
- Decrypt UX: balances start as redacted bars. "Decrypt all" triggers
  one permit signature, then values animate in and stay decrypted for
  the session (IndexedDB permit cache means no re-signing next visit).
- Amounts: 6-decimal cap made visible. For >6-decimal underlyings the
  wrap preview shows "wraps X.XXXXXX, refunds Y" line; input below the
  rate is blocked with an explainer.
- Revoked pairs: separate collapsed section, red badge, wrap disabled,
  unwrap allowed with warning. Tooltip explains what revocation means.
- Every failure path maps to a sentence a human can act on, with the
  raw error behind a "details" disclosure.

## 7. Error handling

- SDK errors: `matchZamaError` switch -> message table in errors.ts.
- Wallet rejections: silent toast "Signature declined - nothing sent".
- RPC failures: banner with retry; reads use TanStack retry/backoff.
- Relayer outage during unshield: timeline parks at "Awaiting
  decryption", pending state persisted, retry button calls
  resumeUnshield - nothing is lost.
- Wrong network: blocking overlay with a switch-to-Sepolia action.

## 8. Testing / verification

- `npm run build` green.
- Node verification script (viem, public RPC): reads registry length,
  pairs slice, metadata for both sides of each pair, and decodes a
  recent UnwrapRequested event from the wrapper logs - proves ABI and
  flow assumptions against live Sepolia before any UI work is trusted.
- Manual wallet pass (Oleksiy): faucet -> shield -> decrypt -> unshield
  end-to-end on Sepolia; checklist in docs/SUBMISSION.md.

## 9. Submission requirements traced

- Public repo + live Vercel demo + README (this repo).
- 3-minute video: live human voice, screen recording (script outline in
  docs/SUBMISSION.md for Serhii). No AI voice - disqualification.
- X thread draft in docs/SUBMISSION.md.
- Name contains no vendor branding: "Cloakroom".
