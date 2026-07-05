# Deploying Cloakroom

Cloakroom is a standard Next.js 15 app. Vercel auto-detects everything; there is
no custom server, no special build step.

## Why deploy a preview early

A live URL is a submission requirement, but the real reason to deploy now is
that a few things only surface in production:

- The FHE SDK loads WASM in a Web Worker from `cdn.zama.org` and talks to the
  Zama relayer. This path cannot be fully exercised without a funded wallet, so
  confirm it on the real domain with a real signature.
- Public RPC endpoints rate-limit under load; a keyed endpoint avoids it.

Deploy a preview, run the manual wallet pass (docs/SUBMISSION.md) against it, and
that same URL becomes the submission URL.

## One-time setup

1. **Public GitHub repo** (submission requires open source). Create it, then:
   ```bash
   git remote add origin https://github.com/<you>/cloakroom.git
   git push -u origin main
   ```
2. **Vercel** → "Add New… → Project" → import the repo. Framework preset is
   detected as Next.js. No build/output overrides needed.
3. **Environment variables** (Project → Settings → Environment Variables):
   | Name | Value | Notes |
   |------|-------|-------|
   | `NEXT_PUBLIC_RPC_URL` | your Sepolia RPC | Alchemy/Infura recommended over public nodes |
   | `NEXT_PUBLIC_MAINNET_RPC_URL` | your mainnet RPC | optional; falls back to a public node |

   Both are `NEXT_PUBLIC_*`, so they are read at build time. Set them before the
   first deploy, or redeploy after adding.
4. **Deploy.** Every push to `main` ships to production; every PR gets a preview
   URL.

Node: Next 15 runs on Vercel's default Node (20/22). Local dev used Node 23; no
version pin is required.

## Headers and CSP (important)

- **Do NOT enable cross-origin isolation** (`Cross-Origin-Opener-Policy` /
  `Cross-Origin-Embedder-Policy`). The relayer worker is single-threaded by
  default (we call `web()` with no `threads`), so it does **not** need
  `SharedArrayBuffer`. Enabling `COEP: require-corp` would block the
  `cdn.zama.org` worker script and break decryption.
- **No CSP is set by default**, which works out of the box. If you add a strict
  Content-Security-Policy later, it must allow:
  ```
  worker-src   'self' blob:;
  script-src   'self' 'wasm-unsafe-eval' https://cdn.zama.org;
  connect-src  'self' https://cdn.zama.org https://relayer.testnet.zama.org
               https://relayer.mainnet.zama.org
               <your Sepolia RPC host> <your mainnet RPC host>;
  img-src      'self' data:;
  ```
  (Injected wallet extensions add their own origins; test with the wallet you
  demo.)

## Post-deploy smoke (do this on the live URL)

1. Registry loads on both Sepolia and Ethereum via the header switcher.
2. Connect a wallet on Sepolia; faucet → shield → **decrypt** (this is the
   worker and relayer path, so watch the console for worker errors), then unshield.
3. Decrypt an off-registry ERC-7984 via the annex card.
4. Open the browser console once: no CSP violations, no failed requests to
   `cdn.zama.org` or the relayer.

If decryption stalls, check the Network tab for a blocked request to
`cdn.zama.org` (CSP) or a relayer 4xx (wrong chain or RPC). Those are the only
two realistic production failures given the current setup.
