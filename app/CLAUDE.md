# app/ — frontend guidance

Vite + React + TypeScript dApp for the Ballast vault. See the repo root
[AGENTS.md](../AGENTS.md) for the big picture, deployed addresses, and contract gotchas.

## Commands

```bash
npm run dev        # stellar scaffold watch --build-clients + vite, at http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run format     # prettier --write
npm test           # vitest run (pure-logic units in src/lib)
npm run typecheck  # tsc
```

To run the UI against the already-deployed contracts **without** the scaffold redeploying and
regenerating the client, use `npx vite` instead of `npm run dev`.

## Tests

- **`src/lib/*.test.ts`** (vitest) — the pure logic: SEP-7 link codec, multisig threshold-weight
  math, signature merge. These are the only unit-tested pieces (no I/O, no DOM).
- Contract tests live at the repo root: `cargo test -p vault`.
- The presentational components and rpc/wallet I/O are covered manually / by the round-trip
  checklist, not unit tests. Don't add a React/DOM test runner unless asked.

## Layout (`src/`)

- **`pages/`** — `Home.tsx` (vault dashboard), `AdminPage.tsx` (multisig allowlist console).
- **`components/`** — `ConnectAccount`, `AnimatedNumber`, `vault/VaultDashboard.tsx` (TVL, LP
  count, share price, position, Deposit/Withdraw; deposit is KYC-gated).
- **`hooks/`** — `useWallet` (wallet context), `useVault` (contract reads), `useAccountSigners`
  (gov signers/thresholds from Horizon), `useIsAdmin` (is the connected wallet a gov signer).
- **`lib/`** — `sep7` / `threshold` / `txSignatures` (pure, unit-tested), `adminTx` (rpc I/O:
  build → simulate → assemble → submit+poll), `adminConfig` (pinned vault + gov ids), `format`.
- **`providers/WalletProvider.tsx`** — polls the wallet; pins the account chosen at connect (does
  NOT follow the wallet's active account, to avoid flicker with multiple accounts).

The generated vault client is imported from `@stellar-scaffold/app-lib/clients`. Regenerate it
with `stellar contract bindings typescript --contract-id <id> --network testnet --output-dir
app-lib/clients/vault --overwrite`, then rebuild it (`npm run build -w vault` from the repo root).

## Routes

- `/` — vault dashboard.
- `/admin` — multisig allowlist console (compose → collect SEP-7 signatures → submit). Nav entry
  and page are gated to gov signers via `useIsAdmin`; this is a UI gate only — real authority is
  on-chain (`require_auth` against gov's thresholds).

## Config & Vite notes

- Env vars are `PUBLIC_STELLAR_*` (exposed by Vite). `app-lib/env.ts` validates them and defaults
  to **testnet** when unset, so the app runs with no `.env`.
- `vite-plugin-wasm` + a `Buffer` polyfill are enabled (the SDK needs them).
