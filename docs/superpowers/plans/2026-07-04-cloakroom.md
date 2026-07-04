# Cloakroom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-grade Sepolia dApp over the deployed confidential wrapper registry: view pairs, shield, two-phase unshield, decrypt balances, faucet.

**Architecture:** Next.js 15 App Router single-page product. wagmi v2 supplies wallet + transport; ZamaProvider (@zama-fhe/react-sdk 3.2.0, wagmi glue, web() CDN worker relayer, IndexedDB storage) exposes SDK hooks; UI renders TanStack Query states. Faucet goes through plain wagmi. Full spec: docs/superpowers/specs/2026-07-04-cloakroom-design.md.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind v4, wagmi 2, viem 2, @tanstack/react-query 5, @zama-fhe/sdk 3.2.0, @zama-fhe/react-sdk 3.2.0, vitest (pure math only).

**Verification levers:** `npm run build`; vitest for lib/format.ts; scripts/verify-chain.mjs live Sepolia reads; Claude Preview browser smoke on wallet-less surfaces. Wallet-signing flows: manual pass checklist in docs/SUBMISSION.md (no funded key in this environment).

---

### Task 1: Scaffold

**Files:** Create `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `.claude/launch.json`.

- [ ] Hand-rolled package.json pinning: next@15, react@19, wagmi@^2, viem@^2, @tanstack/react-query@^5, @zama-fhe/sdk@3.2.0, @zama-fhe/react-sdk@3.2.0, tailwindcss@^4, @tailwindcss/postcss, vitest, typescript@^5
- [ ] `npm install`; expect zero peer errors (ethers optional peer is absent by design)
- [ ] `npm run build` green on placeholder page
- [ ] Commit `chore: scaffold nextjs app`

### Task 2: Chain config + providers + wallet connect

**Files:** Create `lib/chains.ts` (sepolia from @zama-fhe/sdk/chains + wagmi chain, RPC from NEXT_PUBLIC_RPC_URL fallback publicnode, explorer URL helper), `app/providers.tsx` (WagmiProvider -> QueryClientProvider -> ZamaProvider with createConfig from @zama-fhe/react-sdk/wagmi, relayers { [sepolia.id]: web() }, storage indexedDBStorage, onEvent -> activity store), `components/wallet/ConnectButton.tsx`, `components/wallet/NetworkGuard.tsx`, `lib/activity-store.tsx` (context + reducer + localStorage persistence, addEntry/updateEntry API keyed by id).

Contract: `ActivityEntry = { id, kind: 'shield'|'unshield'|'faucet'|'decrypt'|'system', label, status: 'pending'|'success'|'error', txHash?, detail?, ts }`.

- [ ] wagmi config: injected connector (EIP-6963 multi-discovery is automatic in wagmi v2)
- [ ] NetworkGuard: blocking overlay + switchChain(sepolia) action when wrong network
- [ ] Preview: page renders, connect button lists installed wallets or empty-state copy, zero console errors
- [ ] Commit `feat(core): providers, chain config, wallet connect`

### Task 3: Amount math (TDD)

**Files:** Create `lib/format.ts`, `lib/format.test.ts`.

API: `parseAmount(input: string, decimals: number): bigint | null`; `formatAmount(value: bigint, decimals: number, maxFrac?): string`; `wrapPreview(amount: bigint, rate: bigint): { wrapped: bigint, refund: bigint, credited: bigint }` where credited = confidential units (amount/rate), wrapped = credited*rate, refund = amount-wrapped; `shortAddress`, `formatHandle`.

- [ ] Failing tests first: 18-dec WETH with rate 10^12 floors and refunds; 6-dec USDC rate 1 passes through; amount < rate yields credited 0 (UI blocker case); parse rejects '', '.', excess decimals; round-trip format
- [ ] `npx vitest run` fails, implement, passes
- [ ] Commit `feat(math): amount parsing and wrap rounding preview`

### Task 4: Live-chain verification script

**Files:** Create `scripts/verify-chain.mjs` (viem createPublicClient on public RPC; no app imports).

- [ ] Read registry `getTokenConfidentialTokenPairsLength`, `...Slice(0, len)`; assert >= 8 pairs, print validity per pair
- [ ] Multicall name/symbol/decimals/rate for both sides of every pair; assert cToken decimals <= 6
- [ ] getLogs UnwrapRequested (topic from event sig `UnwrapRequested(address,bytes32,bytes32)` - verify actual topic via SDK TOKEN_TOPICS export) over recent blocks on any wrapper; decode one if present
- [ ] Run `node scripts/verify-chain.mjs`; paste output into task notes; fix any ABI drift before UI work
- [ ] Commit `chore(verify): live sepolia read checks`

### Task 5: Registry viewer

**Files:** Create `hooks/usePairs.ts` (useZamaSDK -> sdk.registry.listPairs({metadata:true}) paged loop via useQuery, returns { pairs, isLoading, refresh }), `components/registry/PairsTable.tsx`, `components/registry/PairRow.tsx`, `components/registry/RevokedSection.tsx`, `components/registry/RegistrySearch.tsx`; modify `app/page.tsx`.

- [ ] usePairs walks pages of 50 until total reached; splits valid/revoked; exposes registry.refresh passthrough
- [ ] Row: symbols both sides, name, short addresses with copy + explorer links, decimals/rate line, validity badge, actions (Shield/Unshield/Faucet buttons dispatch selection)
- [ ] Revoked: collapsed section, warning badge, wrap action disabled with tooltip, unwrap allowed
- [ ] Search filters by symbol/name/address
- [ ] Preview: table renders live Sepolia data wallet-less, skeleton while loading
- [ ] Commit `feat(registry): dynamic pairs table with revoked handling`

### Task 6: Portfolio + decryption

**Files:** Create `components/portfolio/Portfolio.tsx`, `components/portfolio/BalanceCard.tsx`, `components/portfolio/RedactedValue.tsx`, `hooks/usePortfolio.ts`.

- [ ] usePortfolio: for connected address, per valid pair - underlying balanceOf (wagmi useReadContracts) + useConfidentialBalances (react-sdk batch) gated behind explicit "Decrypt" action; NoCiphertextError and isEncryptedValueZero -> display 0
- [ ] RedactedValue: blurred block glyphs -> animated reveal on decrypt; lock icon state
- [ ] "Decrypt all" button -> useGrantPermit(all valid cToken addresses) then batch query enabled; permit cache makes next session silent
- [ ] Empty states: disconnected (invite copy), connected-no-balances (faucet CTA)
- [ ] Commit `feat(portfolio): confidential balances with one-signature decrypt-all`

### Task 7: Shield flow

**Files:** Create `components/shield/ShieldPanel.tsx`, `components/shield/AmountInput.tsx` (shared), `components/shield/RatePreview.tsx`, `hooks/useShieldFlow.ts`.

- [ ] Read underlying balance, allowance (useUnderlyingAllowance), rate (wagmi read `rate()`)
- [ ] Amount input with max; RatePreview shows credited/refund via wrapPreview; credited==0 blocks submit with explainer
- [ ] useShield mutation with callbacks -> step chips (Approve -> Wrap or single tx transferAndCall path); approvalStrategy 'exact'
- [ ] Success: toast + invalidate portfolio queries + activity entry; errors via lib/errors.ts mapping
- [ ] Commit `feat(shield): wrap flow with rounding preview and step progress`

### Task 8: Unshield flow (centerpiece)

**Files:** Create `components/unshield/UnshieldPanel.tsx`, `components/unshield/UnshieldTimeline.tsx`, `hooks/useUnshieldFlow.ts`, `hooks/usePendingUnshields.ts`.

- [ ] useUnshieldFlow wraps useUnshield mutation; UnshieldCallbacks (onUnwrapSubmitted/onFinalizing/onFinalizeSubmitted) drive local step state machine: submitted -> decrypting -> finalizing -> done; persist entry to activity store at each transition with tx hashes
- [ ] Amount mode + "Unshield all" (useUnshieldAll); balance check needs decrypted balance - if BalanceCheckUnavailableError, prompt decrypt first (skipBalanceCheck stays false)
- [ ] usePendingUnshields: on mount + per pair, loadPendingUnshieldRequest(indexedDBStorage, wrapper) across valid+revoked pairs -> resume banners; Resume button -> useResumeUnshield(txHash) rejoining the same timeline
- [ ] Failure paths: error at any phase parks timeline with retry (resume) and error detail disclosure
- [ ] Revoked pair: unshield allowed, amber warning banner
- [ ] Commit `feat(unshield): two-phase unwrap with resumable timeline`

### Task 9: Faucet

**Files:** Create `components/faucet/FaucetPanel.tsx`, `hooks/useMintable.ts`, `lib/faucet.ts` (mint ABI fragment, CAP = 1_000_000n).

- [ ] useMintable: useSimulateContract mint(user, 1 unit) per underlying of valid pairs -> mintable map (ctGBP underlying auto-fails -> excluded with "restricted" note)
- [ ] Panel: token select, presets 100 / 1k / 10k / 1M scaled by decimals, cap clamp with note, mint via useWriteContract + receipt wait, success invalidates balances, activity entry
- [ ] Commit `feat(faucet): mock token faucet with on-chain mintability probe`

### Task 10: Activity feed + dev mode

**Files:** Create `components/activity/ActivityDrawer.tsx`, `components/activity/DevMode.tsx`; modify `app/providers.tsx` (onEvent already dispatches; DevMode renders raw SDK event stream entries).

- [ ] Drawer lists activity entries newest-first with status dot, tx links, relative time; persisted via localStorage so history survives reload
- [ ] Dev mode toggle: raw ZamaSDKEvents (encrypt/decrypt/tx submissions with contract addresses) rendered as monospace log - "what is my wallet actually calling"
- [ ] Commit `feat(activity): operation feed with developer mode`

### Task 11: Design polish pass

**Files:** Modify `app/globals.css`, `app/layout.tsx`, all components; create `components/ui/*` primitives as extracted.

- [ ] REQUIRED SUB-SKILL first: frontend-design:frontend-design
- [ ] Theme: dark charcoal, amber accent, mono numerals (tabular-nums), redaction aesthetic for encrypted values; frosted confidential vs clear public visual language
- [ ] States: skeletons on all loads, empty states, focus rings, reduced-motion respect, mobile layout
- [ ] Preview screenshot pass desktop + mobile; fix console warnings
- [ ] Commit `style: production design pass`

### Task 12: Docs + submission kit

**Files:** Create `README.md`, `docs/SUBMISSION.md`, `vercel.json` (only if headers needed); update `.env.example`.

- [ ] README: what/why, architecture diagram (text), quickstart, env vars, how each judged criterion is addressed, contract addresses table sourced-from-registry note
- [ ] SUBMISSION.md: submission checklist, 3-min video script outline (live voice reminder), X thread draft, manual wallet test checklist for Oleksiy
- [ ] Commit `docs: readme and submission kit`

### Task 13: Final verification

- [ ] `npm run build` green; `npx vitest run` green; `node scripts/verify-chain.mjs` green
- [ ] Preview full smoke: registry loads, panels open, faucet probe renders, no console errors
- [ ] REQUIRED SUB-SKILL: superpowers:verification-before-completion
- [ ] Update brain: decisions (SDK choice, no-template choice), projects/cloakroom.md, journal, wins
- [ ] Final commit if needed; report to Oleksiy with manual-test checklist
