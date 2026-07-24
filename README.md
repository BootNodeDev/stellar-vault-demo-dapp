# Ballast Vault (mini)

A minimal reinsurance-style vault on Stellar/Soroban. Liquidity providers deposit USDC and
receive `bvUSDC` shares that track the vault's net asset value; shares are redeemable for USDC
on-chain. Built on the OpenZeppelin Soroban vault, with a React + Freighter dApp.

> **Scope.** Learning-grade PoC ("mini-Ballast") on Stellar testnet. No yield accrual (shares
> stay 1:1 with the underlying) and the owner cannot withdraw LP funds. Deposits, mints and share
> transfers are gated by a **KYC allowlist**; the vault's owner is a **2-of-3 multisig**
> (compliance) that manages that allowlist through a signature-collection admin console.

## Features

- **Vault** — deposit USDC → mint `bvUSDC`; withdraw / redeem back to USDC (1:1, no yield).
- **KYC allowlist** — `deposit`, `mint` and `transfer` require the receiving/sending parties to
  be allowlisted; exits (`withdraw` / `redeem`) stay open so a de-listed holder can still exit.
- **Multisig governance** — the owner is a native 2-of-3 Stellar account; `allow` / `disallow` are
  authorized by quorum. Signatures are collected off-chain by passing **SEP-7 links** between
  signers (no backend), then submitted once the medium threshold is met.
- **Dashboard** — TVL, live **LP count** (on-chain holder counter), share price, your position,
  Deposit / Withdraw. The deposit form is gated by the allowlist; the `/admin` console is visible
  only to gov signers.

## Stack

- **Contracts:** Rust / Soroban, `soroban-sdk` 26, OpenZeppelin `stellar-tokens` / `-access` /
  `-macros` 0.7.2.
- **Frontend:** Vite + React + TypeScript, Stellar Wallets Kit / Freighter, generated contract
  clients (Scaffold Stellar), Vitest for the pure-logic modules.
- **Network:** Stellar testnet.

## Structure

```
contracts/vault      # the vault: deposit/withdraw/mint/redeem, KYC allowlist, LP counter
contracts/counter    # throwaway learning contract
app/                 # Vite + React frontend (dashboard + /admin signing console)
app/src/lib/         # pure logic: SEP-7 codec, threshold math, signature merge (unit-tested)
app-lib/             # scaffold runtime + generated TS contract clients
environments.toml    # scaffold deploy config (network, accounts, contracts)
```

The vault's underlying asset is USDC (via its Stellar Asset Contract); its share token is
`bvUSDC` (7 decimals). The vault *is* the share token — it implements SEP-41.

## Quickstart

Prerequisites: Rust with the `wasm32v1-none` target, Stellar CLI ≥ 25.2, Node 20+.

```bash
stellar contract build          # build contracts to WASM (not `cargo build`)
cargo test -p vault             # run the vault unit tests
cp app/.env.example app/.env    # PUBLIC_STELLAR_* → testnet (env.ts also defaults to testnet)
npm install && npm run dev      # → http://localhost:5173
```

`npm run dev` runs `stellar scaffold watch --build-clients` (compile → deploy → generate TS
clients) alongside Vite. To run the frontend against the already-deployed contracts **without**
the scaffold redeploying and regenerating the client, use `cd app && npx vite`.

## Using the dApp

1. Connect Freighter (set it to **Testnet**).
2. **Enable USDC** — a one-time Stellar trustline so the account can hold USDC.
3. Mint test USDC from Circle's faucet (select Stellar): <https://faucet.circle.com>
4. **Get allowlisted** — deposits are KYC-gated. A gov signer must `allow` your address from the
   `/admin` console. Until then the deposit form shows a KYC notice (withdraw stays open).
5. Deposit USDC to mint `bvUSDC`, or withdraw to redeem.

### Admin console (`/admin`) — multisig allowlist

Visible only when the connected wallet is a gov signer. Compose an `allow` / `disallow` op, then
collect signatures across the 2-of-3:

1. **Compose** (op + target) → you land in the sign view with the first signature.
2. Sign, share the generated link with the next signer; they open it and sign too.
3. Once the medium threshold is met, **Submit**. Submit only broadcasts the already-signed tx —
   the wallet is not prompted again (signatures were gathered in the sign steps).

## Deployed (testnet)

- Vault (owner = gov multisig): `CD5RPBZ6JK5RHJD2JFXCGKFSD7X7HSXCZGE7NNJLOEANPJQQHS57JTGK`
- Gov multisig (2-of-3, owner / compliance admin): `GDVL4VKURSZ7R66IWAORMUNHYHHDQ5Y65TMPWIGV6WDVKTRZZLQBYNXQ`
- USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

## Stellar notes

- USDC is a **classic asset** (needs a trustline to hold); `bvUSDC` is a **Soroban token** (no
  trustline). `bvUSDC` balances don't appear in Horizon — read them from the contract.
- A deposit is a **single transaction** (nested authorization), with no separate `approve`.
- The vault owner being a **multisig account** needs zero multisig code in the contract: it calls
  `require_auth(owner)` and the protocol verifies the account's signers and thresholds.
- Build contracts with `stellar contract build`, not `cargo build`.

See [AGENTS.md](./AGENTS.md) for build/run details and the gotchas learned the hard way.

## License

Apache-2.0. See [LICENSE](./LICENSE).
