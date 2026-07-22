# Ballast Vault (mini)

A minimal reinsurance-style yield vault on Stellar/Soroban. Liquidity providers deposit
USDC and receive `bvUSDC` shares that track the vault's net asset value; shares are
redeemable for USDC on-chain. Built on the OpenZeppelin Soroban vault, with a React +
Freighter dApp.

> **Scope.** Learning-grade PoC ("mini-Ballast"): no yield accrual (shares stay 1:1 with
> the underlying), no KYC, and the owner cannot withdraw LP funds. Runs on Stellar testnet.

## Stack

- **Contracts:** Rust / Soroban, `soroban-sdk` 26, OpenZeppelin `stellar-tokens` 0.7.2.
- **Frontend:** Vite + React + TypeScript, Stellar Wallets Kit / Freighter, generated
  contract clients (Scaffold Stellar).
- **Network:** Stellar testnet.

## Structure

```
contracts/vault      # the vault (deposit / withdraw / mint / redeem / total_assets …)
contracts/counter    # throwaway learning contract
app/                 # Vite + React frontend
app-lib/             # scaffold runtime + generated TS contract clients
environments.toml    # scaffold deploy config (network, accounts, contracts)
```

The vault's underlying asset is USDC (via its Stellar Asset Contract); its share token is
`bvUSDC` (7 decimals).

## Quickstart

Prerequisites: Rust with the `wasm32v1-none` target, Stellar CLI ≥ 25.2, Node 20+.

```bash
# 1. Build the contracts to WASM
stellar contract build

# 2. Configure the frontend network (testnet)
cp app/.env.example app/.env    # then set the PUBLIC_STELLAR_* vars to testnet

# 3. Run the dApp
npm install
npm run dev                     # → http://localhost:5173
```

`npm run dev` runs `stellar scaffold watch --build-clients` (compile → deploy → generate TS
clients) alongside Vite.

## Using the dApp

1. Connect Freighter (set it to **Testnet**).
2. **Enable USDC** — a one-time Stellar trustline so the account can hold USDC.
3. Mint test USDC from Circle's faucet (select Stellar): <https://faucet.circle.com>
4. Deposit USDC to mint `bvUSDC`, or withdraw to redeem.

## Deployed (testnet)

- Vault: `CARQ5UVSDA2ERYX3TDBLGYAPLOWTOQCMC5TVE6YID7JMLR2PVKKFUW4J`
- USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

## Stellar notes

- USDC is a **classic asset** (needs a trustline to hold); `bvUSDC` is a **Soroban token**
  (no trustline). `bvUSDC` balances don't appear in Horizon — read them from the contract.
- A deposit is a **single transaction** (nested authorization), with no separate `approve`.
- Build contracts with `stellar contract build`, not `cargo build`.

See [AGENTS.md](./AGENTS.md) for build/run details and gotchas.

## License

Apache-2.0. See [LICENSE](./LICENSE).
