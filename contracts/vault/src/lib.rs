#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, MuxedAddress, String};
use stellar_tokens::{
    fungible::{Base, FungibleToken},
    vault::{FungibleVault, Vault},
};

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Inicializa el vault. Corre una sola vez, al deployar.
    /// `asset` es el token subyacente (el SAC de USDC). Queda inmutable.
    pub fn __constructor(e: &Env, asset: Address) {
        Vault::set_asset(e, asset);
        Vault::set_decimals_offset(e, 0);
        Base::set_metadata(
            e,
            Vault::decimals(e),
            String::from_str(e, "Ballast Vault USDC"),
            String::from_str(e, "bvUSDC"),
        );
    }
}

// El vault ES el token de shares: delega balance/transfer/total_supply al tipo `Vault` de OZ.
#[contractimpl(contracttrait)]
impl FungibleToken for VaultContract {
    type ContractType = Vault;

    fn decimals(e: &Env) -> u32 {
        Vault::decimals(e)
    }
}

// La lógica de vault. `contracttrait` expone también los métodos default del trait
// (total_assets, convert_to_shares, preview_*). Sobreescribimos los 4 que mutan solo para
// dejarlos explícitos; `Vault` ya maneja la autorización internamente (no la repetimos).
#[contractimpl(contracttrait)]
impl FungibleVault for VaultContract {
    fn deposit(e: &Env, assets: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        Vault::deposit(e, assets, receiver, from, operator)
    }

    fn mint(e: &Env, shares: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        Vault::mint(e, shares, receiver, from, operator)
    }

    fn withdraw(e: &Env, assets: i128, receiver: Address, owner: Address, operator: Address) -> i128 {
        Vault::withdraw(e, assets, receiver, owner, operator)
    }

    fn redeem(e: &Env, shares: i128, receiver: Address, owner: Address, operator: Address) -> i128 {
        Vault::redeem(e, shares, receiver, owner, operator)
    }
}
