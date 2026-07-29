#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token::{StellarAssetClient, TokenClient},
    Address, Env, IntoVal, MuxedAddress,
};

use crate::{VaultContract, VaultContractClient};

// 100 USDC at the SAC's 7 decimals.
const DEPOSIT_AMOUNT: i128 = 1_000_000_000;

struct Fixture {
    e: Env,
    vault_address: Address,
    usdc_address: Address,
    depositor: Address,
}

/// Builds a vault over a freshly issued Stellar asset (USDC SAC) and funds a
/// depositor. Authorizations are mocked so tests exercise gating, not signing.
fn setup() -> Fixture {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let depositor = Address::generate(&e);

    let usdc = e.register_stellar_asset_contract_v2(admin.clone());
    let usdc_address = usdc.address();
    StellarAssetClient::new(&e, &usdc_address).mint(&depositor, &(DEPOSIT_AMOUNT * 10));

    let vault_address = e.register(VaultContract, (usdc_address.clone(), admin.clone()));

    Fixture { e, vault_address, usdc_address, depositor }
}

impl Fixture {
    fn vault(&self) -> VaultContractClient<'_> {
        VaultContractClient::new(&self.e, &self.vault_address)
    }

    /// Grants the depositor an allowance so the vault can pull the underlying.
    fn approve_underlying(&self, amount: i128) {
        self.approve_for(&self.depositor, amount);
    }

    /// Mints underlying USDC to `who`.
    fn fund(&self, who: &Address, amount: i128) {
        StellarAssetClient::new(&self.e, &self.usdc_address).mint(who, &amount);
    }

    /// Grants `who` an allowance so the vault can pull the underlying.
    fn approve_for(&self, who: &Address, amount: i128) {
        TokenClient::new(&self.e, &self.usdc_address).approve(
            who,
            &self.vault_address,
            &amount,
            &1000,
        );
    }

    /// Allowlists, funds, approves and deposits for `who` in one shot.
    fn onboard_depositor(&self, who: &Address, amount: i128) {
        let vault = self.vault();
        vault.allow(who);
        self.fund(who, amount);
        self.approve_for(who, amount);
        vault.deposit(&amount, who, who, who);
    }
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn deposit_reverts_when_receiver_not_allowlisted() {
    let f = setup();
    f.approve_underlying(DEPOSIT_AMOUNT);
    f.vault()
        .deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);
}

#[test]
fn deposit_succeeds_after_allow() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);

    let shares = vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(shares, DEPOSIT_AMOUNT);
    assert_eq!(vault.balance(&f.depositor), DEPOSIT_AMOUNT);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn mint_reverts_when_receiver_not_allowlisted() {
    let f = setup();
    f.approve_underlying(DEPOSIT_AMOUNT);
    f.vault()
        .mint(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);
}

#[test]
fn mint_succeeds_after_allow() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);

    let assets = vault.mint(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(assets, DEPOSIT_AMOUNT);
    assert_eq!(vault.balance(&f.depositor), DEPOSIT_AMOUNT);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn transfer_reverts_when_recipient_not_allowlisted() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    let recipient = Address::generate(&f.e);

    vault.transfer(&f.depositor, &MuxedAddress::from(&recipient), &1);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn transfer_reverts_when_sender_not_allowlisted() {
    let f = setup();
    let vault = f.vault();
    let recipient = Address::generate(&f.e);
    vault.allow(&recipient);

    vault.transfer(&f.depositor, &MuxedAddress::from(&recipient), &1);
}

#[test]
fn is_allowed_reflects_allow_and_disallow() {
    let f = setup();
    let vault = f.vault();

    assert!(!vault.is_allowed(&f.depositor));
    vault.allow(&f.depositor);
    assert!(vault.is_allowed(&f.depositor));
    vault.disallow(&f.depositor);
    assert!(!vault.is_allowed(&f.depositor));
}

#[test]
#[should_panic]
fn allow_rejects_non_owner_caller() {
    // No global auth mock: only a non-owner authorizes, so the owner's
    // required authorization is absent and the call must fail.
    let e = Env::default();
    let admin = Address::generate(&e);
    let non_owner = Address::generate(&e);
    let account = Address::generate(&e);

    let usdc = e.register_stellar_asset_contract_v2(admin.clone());
    let vault_address = e.register(VaultContract, (usdc.address(), admin));
    let vault = VaultContractClient::new(&e, &vault_address);

    e.mock_auths(&[MockAuth {
        address: &non_owner,
        invoke: &MockAuthInvoke {
            contract: &vault_address,
            fn_name: "allow",
            args: (account.clone(),).into_val(&e),
            sub_invokes: &[],
        },
    }]);

    vault.allow(&account);
}

#[test]
#[should_panic]
fn disallow_rejects_non_owner_caller() {
    let e = Env::default();
    let admin = Address::generate(&e);
    let non_owner = Address::generate(&e);
    let account = Address::generate(&e);

    let usdc = e.register_stellar_asset_contract_v2(admin.clone());
    let vault_address = e.register(VaultContract, (usdc.address(), admin));
    let vault = VaultContractClient::new(&e, &vault_address);

    e.mock_auths(&[MockAuth {
        address: &non_owner,
        invoke: &MockAuthInvoke {
            contract: &vault_address,
            fn_name: "disallow",
            args: (account.clone(),).into_val(&e),
            sub_invokes: &[],
        },
    }]);

    vault.disallow(&account);
}

#[test]
fn lp_count_starts_at_zero() {
    let f = setup();
    assert_eq!(f.vault().lp_count(), 0);
}

#[test]
fn lp_count_increments_on_first_deposit() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);

    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_unchanged_when_same_holder_deposits_again() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT * 2);

    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_increments_for_second_holder() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    let bob = Address::generate(&f.e);
    f.onboard_depositor(&bob, DEPOSIT_AMOUNT);

    assert_eq!(vault.lp_count(), 2);
}

#[test]
fn lp_count_decrements_on_full_withdraw() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    let bob = Address::generate(&f.e);
    f.onboard_depositor(&bob, DEPOSIT_AMOUNT);
    assert_eq!(vault.lp_count(), 2);

    vault.withdraw(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_unchanged_on_partial_withdraw() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);
    assert_eq!(vault.lp_count(), 1);

    vault.withdraw(&(DEPOSIT_AMOUNT / 2), &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_increments_on_mint() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);

    vault.mint(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_unchanged_on_full_transfer_to_fresh_holder() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);
    assert_eq!(vault.lp_count(), 1);

    let bob = Address::generate(&f.e);
    vault.allow(&bob);

    vault.transfer(&f.depositor, &MuxedAddress::from(&bob), &DEPOSIT_AMOUNT);

    assert_eq!(vault.lp_count(), 1);
}

#[test]
fn lp_count_decreases_on_full_transfer_to_existing_holder() {
    let f = setup();
    let vault = f.vault();
    vault.allow(&f.depositor);
    f.approve_underlying(DEPOSIT_AMOUNT);
    vault.deposit(&DEPOSIT_AMOUNT, &f.depositor, &f.depositor, &f.depositor);

    let bob = Address::generate(&f.e);
    f.onboard_depositor(&bob, DEPOSIT_AMOUNT);
    assert_eq!(vault.lp_count(), 2);

    vault.transfer(&f.depositor, &MuxedAddress::from(&bob), &DEPOSIT_AMOUNT);

    assert_eq!(vault.lp_count(), 1);
}
