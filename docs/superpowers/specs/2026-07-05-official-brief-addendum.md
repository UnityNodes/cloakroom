# Addendum: official brief gaps (approved 2026-07-05)

The published brief adds requirements beyond the internal spec. Approved design:

## 1. Hybrid registry source (required)

On-chain registry stays the primary source of truth. `config/custom-pairs.ts`
declares additional custom/dev pairs as `{ chainId, tokenAddress,
confidentialTokenAddress }`. At load, custom entries for the active chain are
resolved on-chain (metadata via SDK token objects, wrapper interface checked
via ERC-165, `underlying()` cross-checked against the configured token) and
merged after registry pairs. Dedupe rule: a custom entry whose wrapper address
already exists in the registry is dropped - registry wins. Custom pairs render
with a "custom" badge; entries that fail validation render disabled with a
config-error note. Example lives in README (code comments are banned).

## 2. Decrypt any ERC-7984 (required)

New "Decrypt any token" card under the portfolio: paste an address ->
`Token.isConfidential()` (ERC-165) -> unsupported tokens get a clean error ->
otherwise metadata + permit + `balanceOf` with the standard redaction/reveal
treatment. Successful lookups persist to a tracked list (localStorage, cap 10)
that re-decrypts silently on future visits via cached permits.

## 3. Extensibility docs (judged category)

README gains "Adding a new pair": both paths (on-chain registration appears
automatically; local config with a concrete snippet) plus decrypt-any-token
for unregistered tokens. SUBMISSION.md video script gains the two new beats.

## 4. Mainnet (judged: "stable on both networks")

Chain switcher Sepolia/Mainnet in the header (wagmi store switch when
disconnected, wallet switch when connected). Registry and explorer resolve per
chain (SDK DefaultRegistryAddresses). Faucet tab hidden on mainnet; action
panel shows a real-assets warning chip. NetworkGuard blocks only unsupported
chains, offering both supported targets.
