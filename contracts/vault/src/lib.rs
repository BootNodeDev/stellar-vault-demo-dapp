#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, Address, Env, MuxedAddress, String,
};
use stellar_access::ownable::set_owner;
use stellar_macros::only_owner;
use stellar_tokens::{
    fungible::{allowlist::AllowList, Base, ContractOverrides, FungibleToken},
    vault::{FungibleVault, Vault},
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    /// A gated operation involved an account that is not on the allowlist.
    NotAllowed = 1,
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initializes the vault. Runs once, at deploy time.
    /// `asset` is the underlying token (the USDC SAC) and stays immutable.
    /// `admin` becomes the owner: the compliance admin who manages the allowlist.
    pub fn __constructor(e: &Env, asset: Address, admin: Address) {
        set_owner(e, &admin);
        Vault::set_asset(e, asset);
        Vault::set_decimals_offset(e, 0);
        Base::set_metadata(
            e,
            Vault::decimals(e),
            String::from_str(e, "Ballast Vault USDC"),
            String::from_str(e, "bvUSDC"),
        );
    }

    /// Adds `account` to the KYC allowlist. Owner only.
    #[only_owner]
    pub fn allow(e: &Env, account: Address) {
        AllowList::allow_user(e, &account);
    }

    /// Removes `account` from the KYC allowlist. Owner only.
    #[only_owner]
    pub fn disallow(e: &Env, account: Address) {
        AllowList::disallow_user(e, &account);
    }

    /// Returns whether `account` is on the KYC allowlist.
    pub fn is_allowed(e: &Env, account: Address) -> bool {
        AllowList::allowed(e, &account)
    }
}

// The vault IS the shares token: it delegates balance/transfer/total_supply to OZ's `Vault` type.
#[contractimpl(contracttrait)]
impl FungibleToken for VaultContract {
    type ContractType = Vault;

    fn decimals(e: &Env) -> u32 {
        Vault::decimals(e)
    }

    // KYC gate: both sender and recipient must be allowlisted before delegating.
    fn transfer(e: &Env, from: Address, to: MuxedAddress, amount: i128) {
        if !AllowList::allowed(e, &from) || !AllowList::allowed(e, &to.address()) {
            panic_with_error!(e, VaultError::NotAllowed);
        }
        Vault::transfer(e, &from, &to, amount);
    }

    fn transfer_from(e: &Env, spender: Address, from: Address, to: Address, amount: i128) {
        if !AllowList::allowed(e, &from) || !AllowList::allowed(e, &to) {
            panic_with_error!(e, VaultError::NotAllowed);
        }
        Vault::transfer_from(e, &spender, &from, &to, amount);
    }
}

// The vault logic. `contracttrait` also exposes the trait's default methods
// (total_assets, convert_to_shares, preview_*). We override the four mutating ones to keep
// them explicit; `Vault` already handles authorization internally (we do not repeat it).
#[contractimpl(contracttrait)]
impl FungibleVault for VaultContract {
    // KYC gate: the share recipient must be allowlisted before delegating.
    fn deposit(e: &Env, assets: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        if !AllowList::allowed(e, &receiver) {
            panic_with_error!(e, VaultError::NotAllowed);
        }
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
