# AGENTS.md

Guidance for agents and developers working in this repo.

## What this is

A minimal reinsurance-style yield vault on Stellar/Soroban (built on the OpenZeppelin
Soroban vault) plus a React + Freighter dApp. Learning-grade PoC:
LPs deposit USDC and receive `bvUSDC` shares that track the vault's NAV, redeemable
on-chain. No yield accrual (shares stay 1:1); the owner cannot withdraw LP funds. A KYC
allowlist gates entry (`deposit`/`mint`) and share transfers; the owner is a 2-of-3
multisig (compliance) that manages the allowlist. The contract also tracks the current
LP count (holders with shares > 0). Runs on Stellar **testnet**.

## Layout

- `contracts/vault` — the vault contract (ERC-4626-equivalent). Underlying = USDC via its SAC; shares = `bvUSDC` (7 decimals).
- `contracts/counter` — throwaway learning contract.
- `app/` — Vite + React + TypeScript frontend (vault dashboard + `/admin` allowlist console with multisig signing).
- `app-lib/` — Scaffold Stellar runtime + generated contract clients.
- `environments.toml` — Scaffold Stellar deploy config (networks, accounts, contracts).

## Build & run

- **Contracts:** `stellar contract build` — NOT `cargo build`. The OZ crates enable an
  experimental `soroban-sdk` feature (`spec_shaking_v2`) that only works through the CLI
  wrapper (Stellar CLI ≥ 25.2).
- **Tests:** `cargo test -p vault` (unit tests run against the in-memory `Env`).
- **Frontend:** `npm install`, then `npm run dev` — runs `stellar scaffold watch --build-clients`
  (compiles, deploys, regenerates TS clients) alongside Vite at `http://localhost:5173`.

## Network config (important)

Two separate systems that must agree:

- `environments.toml` — the network the CLI/scaffold **deploys** to.
- `app/.env` (`PUBLIC_STELLAR_*`) — the network the **frontend** talks to at runtime.

The scaffold default is a local network (`localhost:8000`). Set both to testnet (see
`app/.env.example`) or the UI reads the wrong network.

## Deployed (testnet)

- Vault (owner = gov multisig): `CAHC7K5NWSN3VFKBWU7VJT7H3E4VF55ODD6ZMRB32MCII64G3YAMI5QA`
- Gov multisig (2-of-3, owner / compliance admin): `GDVL4VKURSZ7R66IWAORMUNHYHHDQ5Y65TMPWIGV6WDVKTRZZLQBYNXQ`
- USDC (Circle testnet): issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`,
  SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

## Gotchas (learned the hard way)

- Build with `stellar contract build`, not `cargo build`.
- OZ vault wiring: `#[contractimpl(contracttrait)]` on **both** `FungibleToken` and
  `FungibleVault`; `type ContractType = Vault` goes **only** on `FungibleToken`; import
  `soroban_sdk::MuxedAddress` (the contracttrait macro references it).
- Do **not** call `operator.require_auth()` inside overridden vault methods — `Vault::*`
  already authorizes; a second call fails with `Error(Auth, ExistingValue)`.
- `motion` must be v12+ (`motion/react`); a bare `npm i motion` pulls v10 (Motion One), which
  lacks the React entry.
- `ed25519-dalek` v3 breaks the test build; pin to `2.2.0` if it resolves higher.
- USDC is a **classic asset** → an account needs a trustline to hold it; `bvUSDC` is a
  **Soroban contract token** → no trustline. The deposit is a single transaction (nested
  authorization), with no separate `approve`. Get test USDC from Circle's faucet (pick
  Stellar) after establishing the trustline.

## Conventions

- Conventional Commits. No AI attribution in commit messages.
