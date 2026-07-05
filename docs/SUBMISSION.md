# Submission kit — Bounty Track Season 3

Deadline: **2026-07-07 23:59 AoE**. Form: forms.zama.org (Season 3 Bounty Track).

## Checklist

- [ ] Public GitHub repo (push this repo; verify no secrets: only NEXT_PUBLIC_RPC_URL is used)
- [ ] Live demo on Vercel (Dmytro) — set NEXT_PUBLIC_RPC_URL to a keyed Sepolia endpoint
- [ ] Run `npm run verify:chain` right before submitting (testnet contracts can move)
- [ ] 3-minute video — **live human voice, no AI voice/video (disqualification!)**. Screen recording + voice is fine, face-cam not required (Serhii)
- [ ] X thread published, link saved (Serhii)
- [ ] Project name contains no vendor branding: "Cloakroom" ✓
- [ ] Manual end-to-end pass on the deployed URL (checklist below)

## Manual test pass (Oleksiy, ~10 min, needs Sepolia ETH)

1. Open deployed URL in a fresh browser profile with MetaMask on Sepolia.
2. Registry: all 9+ pairs load, search works, addresses link to Etherscan.
3. Faucet: open cUSDCMock → Faucet, mint 1,000 USDCMock; check restricted note on ctGBP (non-mock).
4. Shield: wrap 250 USDCMock; watch Approve → Wrap chips; balance updates.
5. Shield WETHMock with 1.2345678: preview must show 1.234567 wrapped / 0.0000008 refunded; try 0.0000005 — must be blocked (below rate).
6. Decrypt: "Decrypt all balances" → single EIP-712 signature → values animate in. Reload page → balances decrypt silently (cached permit).
7. Unshield: unshield 100 cUSDCMock → two wallet confirmations, timeline walks all four steps → USDCMock back.
8. **Resume drill:** start another unshield, close the tab right after the first confirmation. Reopen → amber "unfinished unwrap" banner → Resume → finalizes.
9. Activity: entries with tx links; dev mode streams SDK events.
10. Decrypt-any-token: paste cUSDCMock wrapper address → decrypts; paste the USDC underlying address → clean "not an ERC-7984" error; tracked card survives reload.
11. Custom pair: add a dev entry to config/custom-pairs.ts locally per README, verify "custom" badge and working wrap; break the address on purpose, verify "config error" row.
12. Disconnect wallet: hero + invite states look right. Mobile width: rows wrap cleanly.

## 3-minute video script (live voice — talking points, not a teleprompter)

1. **0:00–0:20 Hook.** "Every ERC-20 balance you hold is public. Cloakroom is a coat-check for tokens: hand in a public token, hold it encrypted, take it back whenever." Show hero, decrypt-all reveal.
2. **0:20–0:50 Registry.** Scroll pairs: "Everything on screen is read live from the on-chain registry — including this steakcUSDC pair that was added after we started building. Zero hardcoded tokens. Revoked wrappers get quarantined but exits stay open."
3. **0:50–1:20 Faucet + Shield.** Mint test USDC, wrap it. Flash the WETH rounding preview: "six-decimal cap, so we show exactly what wraps and what comes back."
4. **1:20–2:20 Unshield — the centerpiece.** "Unwrapping confidential tokens is asynchronous: the encrypted amount has to be publicly decrypted before tokens release. Most UIs lose you here." Run it: four-step timeline, two signatures. Then the killer: close the tab mid-flow, reopen, Resume banner, finalize. "Nothing lost, ever."
5. **2:20–2:40 Decrypt — including outside the registry.** One signature → all balances. Then paste an arbitrary ERC-7984 address into "Decrypt any confidential token": "any confidential token works, registered or not — and a wrong address gets a clean error, not a spinner." Toggle dev mode briefly: "every contract call, live."
6. **2:40–2:55 Extensibility.** Show config/custom-pairs.ts in the editor: "adding a pair is one config entry — validated on-chain, badged as custom. And pairs registered in the official registry appear with zero changes — this ninth pair arrived mid-development."
7. **2:55–3:00 Close.** "Production-quality confidential DeFi on the official registry. Cloakroom." URL on screen.

## X thread draft (Serhii — adjust voice, keep facts)

1/ Your token balances are public. Anyone with your address sees everything. We built Cloakroom — a coat-check for ERC-20s: deposit public tokens, hold them encrypted, withdraw whenever. Live on Sepolia: [URL]

2/ Under the hood: the confidential wrapper registry + ERC-7984. Cloakroom reads every pair live from the on-chain registry — a pair added yesterday shows up today with zero code changes. Revoked wrappers are quarantined automatically.

3/ Wrapping is easy. UNwrapping is the hard part — it's a two-phase async flow with a public decryption in the middle. Cloakroom turns it into a living timeline, and if you close the tab mid-flow it resumes exactly where you stopped. [GIF of resume]

4/ Your encrypted balances decrypt with one EIP-712 signature — locally, only for you. Block explorers see ▓▓▓▓▓▓. You see numbers. [GIF of reveal]

5/ Faucet included: mint test tokens and run the full loop in two minutes. Dev mode shows every contract call for the curious. Repo: [GITHUB]. Built for the Season 3 Bounty Track.

## Submission form blurb (short description)

Cloakroom is a production-grade dApp for the Sepolia confidential wrapper
registry: dynamic registry coverage (zero hardcoded tokens, revoked-pair
quarantine), wrap with rounding preview, a resumable four-step async unwrap
timeline, one-signature decryption of all balances, an auto-probed faucet, and
a developer mode streaming every SDK call. Built with the v3 FHE SDK on
Next.js 15 + wagmi v3.
