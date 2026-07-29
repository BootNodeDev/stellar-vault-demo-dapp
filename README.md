# Stellar Vault Demo

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/network-Stellar%20testnet-black.svg)](https://developers.stellar.org)
[![Built with Soroban](https://img.shields.io/badge/built%20with-Soroban-purple.svg)](https://stellar.org/soroban)

A minimal reinsurance-style vault on **Stellar / Soroban**. Liquidity providers deposit USDC and receive `bvUSDC` shares that track the vault's net asset value, redeemable for USDC on-chain. Built on the OpenZeppelin Soroban vault, with a React + Freighter dApp and a multisig-governed KYC allowlist.

**Live demo (Stellar testnet):** <https://stellar-vault-demo-dapp-app-alpha.vercel.app>

> [!NOTE]
> Learning-grade proof of concept running on Stellar **testnet**. Shares stay 1:1 with the underlying (no yield accrual) and the owner cannot withdraw LP funds. It exists to explore Soroban vaults, native multisig governance, and a backend-free signature-collection flow — not for production use.

## Features

- **ERC-4626-style vault** — deposit USDC to mint `bvUSDC`; withdraw or redeem back to USDC (1:1, no yield). The vault *is* the share token (implements SEP-41).
- **KYC allowlist** — `deposit`, `mint` and `transfer` require the counterparties to be allowlisted; exits (`withdraw` / `redeem`) stay open, so a de-listed holder can always leave.
- **Native multisig governance** — the vault owner is a 2-of-3 Stellar account. `allow` / `disallow` are authorized by quorum with **no multisig code in the contract**: it calls `owner.require_auth()` and the protocol resolves the account's signers and thresholds.
- **Backend-free signing** — signatures are gathered by passing **admin links** (a `#tx=` hash-fragment transport) between signers, then broadcast once the threshold is met. No server, no key custody.
- **Live dashboard** — TVL, on-chain **LP count**, share price, your position, and gated Deposit / Withdraw. The `/admin` console is visible only to governance signers.

## How it works

```mermaid
flowchart LR
  LP([Liquidity provider])
  Gov([2-of-3 multisig owner])
  subgraph chain[Stellar testnet]
    Vault["Vault contract (bvUSDC shares)"]
  end
  LP -- deposit USDC --> Vault
  Vault -- mint bvUSDC --> LP
  Gov -- allow / disallow --> Vault
  Vault -. "owner.require_auth()" .-> Gov
```

Entry is gated: a governance signer must `allow` an address before it can deposit. Authority is enforced on-chain — the `/admin` console only *collects* the quorum's signatures; the network verifies them against the owner account's thresholds.

## Stack

- **Contracts:** Rust / Soroban (`soroban-sdk`), OpenZeppelin `stellar-tokens` / `stellar-access` / `stellar-macros`.
- **Frontend:** Vite + React + TypeScript, Stellar Wallets Kit / Freighter, generated contract clients (Scaffold Stellar), Vitest for the pure-logic modules.
- **Network:** Stellar testnet.

## Project structure

```
contracts/vault      # the vault: deposit/withdraw/mint/redeem, KYC allowlist, LP counter
contracts/counter    # throwaway learning contract
app/                 # Vite + React frontend (dashboard + /admin signing console)
app/src/lib/         # pure logic: admin-link codec, threshold math, signature merge (unit-tested)
app-lib/             # scaffold runtime + generated TS contract clients
environments.toml    # scaffold deploy config (network, accounts, contracts)
```

## Getting started

> [!IMPORTANT]
> Prerequisites: Rust with the `wasm32v1-none` target, Stellar CLI ≥ 25.2, and Node 20+.

```bash
stellar contract build          # build contracts to WASM
cargo test -p vault             # run the vault unit tests
cp app/.env.example app/.env    # point the frontend at testnet
npm install && npm run dev      # http://localhost:5173
```

`npm run dev` runs `stellar scaffold watch --build-clients` (compile → deploy → regenerate TS clients) alongside Vite. To run the frontend against the **already-deployed** contracts without redeploying, use `cd app && npx vite`.

> [!WARNING]
> Build the contracts with `stellar contract build`, not `cargo build`. The OpenZeppelin crates enable an experimental `soroban-sdk` feature that only works through the CLI wrapper.

## Using the dApp

1. Open the [live demo](https://stellar-vault-demo-dapp-app-alpha.vercel.app) (or your local instance) and connect **Freighter**, set to **Testnet**.
2. **Enable USDC** — a one-time Stellar trustline so the account can hold USDC.
3. Mint test USDC from [Circle's faucet](https://faucet.circle.com) (select Stellar).
4. **Get allowlisted** — deposits are KYC-gated. A governance signer must `allow` your address from the `/admin` console; until then the deposit form shows a KYC notice (withdraw stays open).
5. **Deposit** USDC to mint `bvUSDC`, or **withdraw** to redeem.

### Admin console — multisig allowlist (`/admin`)

Visible only when the connected wallet is a governance signer. Compose an `allow` / `disallow` op, then collect signatures across the 2-of-3:

1. **Compose** (op + target) — you land in the sign view holding the first signature.
2. **Sign**, then share the generated link with the next signer; they open it and sign too.
3. Once the medium threshold is met, **Submit** — it only broadcasts the already-signed transaction; the wallet is not prompted again.

### Try it yourself — demo signer keys (testnet)

> [!CAUTION]
> These are **throwaway testnet keys, published on purpose** so anyone can try the multisig flow. They hold no value and control nothing real. **Never** reuse them on mainnet or send anything of value to them.

The owner is a 2-of-3 multisig. Import these two governance signers into Freighter (Testnet) — together they meet the 2-of-3 threshold:

| Signer | Secret seed |
| --- | --- |
| `gov` (owner + signer 1) | `SDAMOWWJSMUXRWJHHFZOPL4USLPCEBJO3SCQ6L3PTF4INVMQUPZPH3L2` |
| `gov2` (signer 2) | `SDZBPTPPCQUL3KHM7EMMPSOO2O4FKQOVDU5G34524KBOUU7FJ6G2FIC3` |

Then run the full round-trip solo:

1. Fund your own wallet with friendbot and get test USDC (steps above).
2. In `/admin`, connected as **gov**, compose `allow(<your address>)` and sign; share the link, switch to **gov2**, sign, then submit.
3. Switch back to your wallet — now allowlisted — and deposit USDC to mint `bvUSDC`.

## Deployed (testnet)

| Component | Address |
| --- | --- |
| Vault (owner = gov multisig) | `CD5RPBZ6JK5RHJD2JFXCGKFSD7X7HSXCZGE7NNJLOEANPJQQHS57JTGK` |
| Gov multisig (2-of-3, compliance admin) | `GDVL4VKURSZ7R66IWAORMUNHYHHDQ5Y65TMPWIGV6WDVKTRZZLQBYNXQ` |
| USDC issuer (Circle testnet) | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| USDC SAC (vault's underlying) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

> [!TIP]
> USDC is a **classic asset** (needs a trustline to hold); `bvUSDC` is a **Soroban token** (no trustline, and not shown in Horizon — read balances from the contract). A deposit is a **single transaction** with nested authorization, so there is no separate `approve` step.

See [AGENTS.md](./AGENTS.md) for build/run details and the Stellar gotchas learned the hard way.
