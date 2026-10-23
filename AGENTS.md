# Cloakroom — project notes

Bounty app over the Sepolia confidential wrapper registry. Frontend only, no
custom contracts. Full context: docs/superpowers/specs/, brain/projects/cloakroom.md.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build. NEVER run while the dev server is up:
  they share .next and the dev server breaks with phantom module errors.
  Stop dev → build → restart dev (rm -rf .next if it already broke).
- `npm test` — vitest for lib/format.ts math
- `npm run verify:chain` — live Sepolia assumption checks; run before any deploy

## Hard rules

- Project name must not contain "Zama" (bounty disqualification)
- wagmi stays on v3 (react-sdk's wagmi glue breaks Next prod builds on v2)
- Import wagmi connectors via granular subpaths (wagmi/connectors/injected),
  not the barrel — the barrel drags in Tempo with an unresolvable optional peer
- Registry data is never hardcoded; pairs, validity and mintability are read
  or probed on-chain at runtime
- Revoked pairs: wrap blocked, unshield allowed (exits must never be stranded)
