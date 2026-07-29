import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAHC7K5NWSN3VFKBWU7VJT7H3E4VF55ODD6ZMRB32MCII64G3YAMI5QA",
  }
} as const

export const VaultError = {
  /**
   * A gated operation involved an account that is not on the allowlist.
   */
  1: {message:"NotAllowed"}
}

export const OwnableError = {
  2100: {message:"OwnerNotSet"},
  2101: {message:"TransferInProgress"},
  2102: {message:"OwnerAlreadySet"}
}

export const SorobanFixedPointError = {
  /**
   * Arithmetic overflow occurred
   */
  1500: {message:"Overflow"},
  /**
   * Division by zero
   */
  1501: {message:"DivisionByZero"}
}



export const VaultTokenError = {
  /**
   * Indicates access to uninitialized vault asset address.
   */
  400: {message:"VaultAssetAddressNotSet"},
  /**
   * Indicates that vault asset address is already set.
   */
  401: {message:"VaultAssetAddressAlreadySet"},
  /**
   * Indicates that vault virtual decimals offset is already set.
   */
  402: {message:"VaultVirtualDecimalsOffsetAlreadySet"},
  /**
   * Indicates the amount is not a valid vault assets value.
   */
  403: {message:"VaultInvalidAssetsAmount"},
  /**
   * Indicates the amount is not a valid vault shares value.
   */
  404: {message:"VaultInvalidSharesAmount"},
  /**
   * Attempted to deposit more assets than the max amount for address.
   */
  405: {message:"VaultExceededMaxDeposit"},
  /**
   * Attempted to mint more shares than the max amount for address.
   */
  406: {message:"VaultExceededMaxMint"},
  /**
   * Attempted to withdraw more assets than the max amount for address.
   */
  407: {message:"VaultExceededMaxWithdraw"},
  /**
   * Attempted to redeem more shares than the max amount for address.
   */
  408: {message:"VaultExceededMaxRedeem"},
  /**
   * Maximum number of decimals offset exceeded
   */
  409: {message:"VaultMaxDecimalsOffsetExceeded"},
  /**
   * Indicates overflow due to mathematical operations
   */
  410: {message:"MathOverflow"}
}






export const FungibleTokenError = {
  /**
   * Indicates an error related to the current balance of account from which
   * tokens are expected to be transferred.
   */
  100: {message:"InsufficientBalance"},
  /**
   * Indicates a failure with the allowance mechanism when a given spender
   * doesn't have enough allowance.
   */
  101: {message:"InsufficientAllowance"},
  /**
   * Indicates an invalid value for `live_until_ledger` when setting an
   * allowance.
   */
  102: {message:"InvalidLiveUntilLedger"},
  /**
   * Indicates an error when an input that must be >= 0
   */
  103: {message:"LessThanZero"},
  /**
   * Indicates overflow when adding two values
   */
  104: {message:"MathOverflow"},
  /**
   * Indicates access to uninitialized metadata
   */
  105: {message:"UnsetMetadata"},
  /**
   * Indicates that the operation would have caused `total_supply` to exceed
   * the `cap`.
   */
  106: {message:"ExceededCap"},
  /**
   * Indicates the supplied `cap` is not a valid cap value.
   */
  107: {message:"InvalidCap"},
  /**
   * Indicates the Cap was not set.
   */
  108: {message:"CapNotSet"},
  /**
   * Indicates the SAC address was not set.
   */
  109: {message:"SACNotSet"},
  /**
   * Indicates a SAC address different than expected.
   */
  110: {message:"SACAddressMismatch"},
  /**
   * Indicates a missing function parameter in the SAC contract context.
   */
  111: {message:"SACMissingFnParam"},
  /**
   * Indicates an invalid function parameter in the SAC contract context.
   */
  112: {message:"SACInvalidFnParam"},
  /**
   * The user is not allowed to perform this operation
   */
  113: {message:"UserNotAllowed"},
  /**
   * The user is blocked and cannot perform this operation
   */
  114: {message:"UserBlocked"}
}

export interface Client {
  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint: ({shares, receiver, from, operator}: {shares: i128, receiver: string, from: string, operator: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the name for this token.
   * 
   * # Arguments
   * 
   * * `e` - Access to Soroban environment.
   */
  name: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a allow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adds `account` to the KYC allowlist. Owner only.
   */
  allow: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a redeem transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  redeem: ({shares, receiver, owner, operator}: {shares: i128, receiver: string, owner: string, operator: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the symbol for this token.
   * 
   * # Arguments
   * 
   * * `e` - Access to Soroban environment.
   */
  symbol: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sets the amount of tokens a `spender` is allowed to spend on behalf of
   * an `owner`. Overrides any existing allowance set between `spender` and
   * `owner`.
   * 
   * # Arguments
   * 
   * * `e` - Access to Soroban environment.
   * * `owner` - The address holding the tokens.
   * * `spender` - The address authorized to spend the tokens.
   * * `amount` - The amount of tokens made available to `spender`.
   * * `live_until_ledger` - The ledger number at which the allowance
   * expires.
   * 
   * # Errors
   * 
   * * [`FungibleTokenError::InvalidLiveUntilLedger`] - Occurs when
   * attempting to set `live_until_ledger` that is less than the current
   * ledger number and greater than `0`.
   * * [`FungibleTokenError::LessThanZero`] - Occurs when `amount < 0`.
   * 
   * # Events
   * 
   * * topics - `["approve", from: Address, spender: Address]`
   * * data - `[amount: i128, live_until_ledger: u32]`
   */
  approve: ({owner, spender, amount, live_until_ledger}: {owner: string, spender: string, amount: i128, live_until_ledger: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the amount of tokens held by `account`.
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `account` - The address for which the balance is being queried.
   */
  balance: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deposit: ({assets, receiver, from, operator}: {assets: i128, receiver: string, from: string, operator: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a disallow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Removes `account` from the KYC allowlist. Owner only.
   */
  disallow: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a lp_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the number of addresses that currently hold vault shares
   * (share balance > 0) — the count of active liquidity providers.
   */
  lp_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a max_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the maximum amount of vault shares that can be minted
   * for the given receiver address (currently `i128::MAX`).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `receiver` - The address that would receive the vault shares.
   */
  max_mint: ({receiver}: {receiver: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdraw: ({assets, receiver, owner, operator}: {assets: i128, receiver: string, owner: string, operator: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the amount of tokens a `spender` is allowed to spend on behalf
   * of an `owner`.
   * 
   * # Arguments
   * 
   * * `e` - Access to Soroban environment.
   * * `owner` - The address holding the tokens.
   * * `spender` - The address authorized to spend the tokens.
   */
  allowance: ({owner, spender}: {owner: string, spender: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a is_allowed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns whether `account` is on the KYC allowlist.
   */
  is_allowed: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a max_redeem transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the maximum amount of vault shares that can be redeemed
   * by the given owner (equal to their vault share balance).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `owner` - The address that owns the vault shares.
   */
  max_redeem: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a max_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the maximum amount of underlying assets that can be deposited
   * for the given receiver address (currently `i128::MAX`).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `receiver` - The address that would receive the vault shares.
   */
  max_deposit: ({receiver}: {receiver: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a query_asset transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the address of the underlying asset that the vault manages.
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultAssetAddressNotSet`] - When the
   * vault's underlying asset address has not been initialized.
   */
  query_asset: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a max_withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the maximum amount of underlying assets that can be
   * withdrawn by the given owner, limited by their vault share balance.
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `owner` - The address that owns the vault shares.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidSharesAmount`] - When
   * shares < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  max_withdraw: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a preview_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Simulates and returns the amount of underlying assets required to mint
   * a given amount of vault shares (rounded up).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `shares` - The amount of vault shares to simulate minting.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidSharesAmount`] - When
   * shares < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  preview_mint: ({shares}: {shares: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a total_assets transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the total amount of underlying assets held by the vault.
   * 
   * This represents the vault's balance of the underlying asset, which
   * determines the conversion rate between shares and assets.
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultAssetAddressNotSet`] - When the
   * vault's underlying asset address has not been initialized.
   */
  total_assets: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the total amount of tokens in circulation.
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   */
  total_supply: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a preview_redeem transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Simulates and returns the amount of underlying assets that would be
   * received for redeeming a given amount of vault shares (rounded down).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `shares` - The amount of vault shares to simulate redeeming.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidSharesAmount`] - When
   * shares < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  preview_redeem: ({shares}: {shares: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a preview_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Simulates and returns the amount of vault shares that would be minted
   * for a given deposit of underlying assets (rounded down).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `assets` - The amount of underlying assets to simulate depositing.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidAssetsAmount`] - When
   * assets < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  preview_deposit: ({assets}: {assets: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a preview_withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Simulates and returns the amount of vault shares that would be burned
   * to withdraw a given amount of underlying assets (rounded up).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `assets` - The amount of underlying assets to simulate withdrawing.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidAssetsAmount`] - When
   * assets < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  preview_withdraw: ({assets}: {assets: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a convert_to_assets transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Converts an amount of vault shares to the equivalent amount of
   * underlying assets (rounded down).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `shares` - The amount of vault shares to convert.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidSharesAmount`] - When
   * shares < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  convert_to_assets: ({shares}: {shares: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a convert_to_shares transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Converts an amount of underlying assets to the equivalent amount of
   * vault shares (rounded down).
   * 
   * # Arguments
   * 
   * * `e` - Access to the Soroban environment.
   * * `assets` - The amount of underlying assets to convert.
   * 
   * # Errors
   * 
   * * [`crate::vault::VaultTokenError::VaultInvalidAssetsAmount`] - When
   * assets < 0.
   * * [`crate::vault::VaultTokenError::MathOverflow`] - When mathematical
   * operations result in overflow.
   */
  convert_to_shares: ({assets}: {assets: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, admin}: {asset: string, admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({asset, admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAEAAABDQSBnYXRlZCBvcGVyYXRpb24gaW52b2x2ZWQgYW4gYWNjb3VudCB0aGF0IGlzIG5vdCBvbiB0aGUgYWxsb3dsaXN0LgAAAAAKTm90QWxsb3dlZAAAAAAAAQ==",
        "AAAAAAAAAAAAAAAEbWludAAAAAQAAAAAAAAABnNoYXJlcwAAAAAACwAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAIb3BlcmF0b3IAAAATAAAAAQAAAAs=",
        "AAAAAAAAAFVSZXR1cm5zIHRoZSBuYW1lIGZvciB0aGlzIHRva2VuLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIFNvcm9iYW4gZW52aXJvbm1lbnQuAAAAAAAABG5hbWUAAAAAAAAAAQAAABA=",
        "AAAAAAAAADBBZGRzIGBhY2NvdW50YCB0byB0aGUgS1lDIGFsbG93bGlzdC4gT3duZXIgb25seS4AAAAFYWxsb3cAAAAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAAA",
        "AAAAAAAAAAAAAAAGcmVkZWVtAAAAAAAEAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAhvcGVyYXRvcgAAABMAAAABAAAACw==",
        "AAAAAAAAAFdSZXR1cm5zIHRoZSBzeW1ib2wgZm9yIHRoaXMgdG9rZW4uCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gU29yb2JhbiBlbnZpcm9ubWVudC4AAAAABnN5bWJvbAAAAAAAAAAAAAEAAAAQ",
        "AAAAAAAAAyZTZXRzIHRoZSBhbW91bnQgb2YgdG9rZW5zIGEgYHNwZW5kZXJgIGlzIGFsbG93ZWQgdG8gc3BlbmQgb24gYmVoYWxmIG9mCmFuIGBvd25lcmAuIE92ZXJyaWRlcyBhbnkgZXhpc3RpbmcgYWxsb3dhbmNlIHNldCBiZXR3ZWVuIGBzcGVuZGVyYCBhbmQKYG93bmVyYC4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byBTb3JvYmFuIGVudmlyb25tZW50LgoqIGBvd25lcmAgLSBUaGUgYWRkcmVzcyBob2xkaW5nIHRoZSB0b2tlbnMuCiogYHNwZW5kZXJgIC0gVGhlIGFkZHJlc3MgYXV0aG9yaXplZCB0byBzcGVuZCB0aGUgdG9rZW5zLgoqIGBhbW91bnRgIC0gVGhlIGFtb3VudCBvZiB0b2tlbnMgbWFkZSBhdmFpbGFibGUgdG8gYHNwZW5kZXJgLgoqIGBsaXZlX3VudGlsX2xlZGdlcmAgLSBUaGUgbGVkZ2VyIG51bWJlciBhdCB3aGljaCB0aGUgYWxsb3dhbmNlCmV4cGlyZXMuCgojIEVycm9ycwoKKiBbYEZ1bmdpYmxlVG9rZW5FcnJvcjo6SW52YWxpZExpdmVVbnRpbExlZGdlcmBdIC0gT2NjdXJzIHdoZW4KYXR0ZW1wdGluZyB0byBzZXQgYGxpdmVfdW50aWxfbGVkZ2VyYCB0aGF0IGlzIGxlc3MgdGhhbiB0aGUgY3VycmVudApsZWRnZXIgbnVtYmVyIGFuZCBncmVhdGVyIHRoYW4gYDBgLgoqIFtgRnVuZ2libGVUb2tlbkVycm9yOjpMZXNzVGhhblplcm9gXSAtIE9jY3VycyB3aGVuIGBhbW91bnQgPCAwYC4KCiMgRXZlbnRzCgoqIHRvcGljcyAtIGBbImFwcHJvdmUiLCBmcm9tOiBBZGRyZXNzLCBzcGVuZGVyOiBBZGRyZXNzXWAKKiBkYXRhIC0gYFthbW91bnQ6IGkxMjgsIGxpdmVfdW50aWxfbGVkZ2VyOiB1MzJdYAAAAAAAB2FwcHJvdmUAAAAABAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAARbGl2ZV91bnRpbF9sZWRnZXIAAAAAAAAEAAAAAA==",
        "AAAAAAAAAKpSZXR1cm5zIHRoZSBhbW91bnQgb2YgdG9rZW5zIGhlbGQgYnkgYGFjY291bnRgLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIHRoZSBTb3JvYmFuIGVudmlyb25tZW50LgoqIGBhY2NvdW50YCAtIFRoZSBhZGRyZXNzIGZvciB3aGljaCB0aGUgYmFsYW5jZSBpcyBiZWluZyBxdWVyaWVkLgAAAAAAB2JhbGFuY2UAAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAHZGVwb3NpdAAAAAAEAAAAAAAAAAZhc3NldHMAAAAAAAsAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAACG9wZXJhdG9yAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAADVSZW1vdmVzIGBhY2NvdW50YCBmcm9tIHRoZSBLWUMgYWxsb3dsaXN0LiBPd25lciBvbmx5LgAAAAAAAAhkaXNhbGxvdwAAAAEAAAAAAAAAB2FjY291bnQAAAAAEwAAAAA=",
        "AAAAAAAAAIFSZXR1cm5zIHRoZSBudW1iZXIgb2YgYWRkcmVzc2VzIHRoYXQgY3VycmVudGx5IGhvbGQgdmF1bHQgc2hhcmVzCihzaGFyZSBiYWxhbmNlID4gMCkg4oCUIHRoZSBjb3VudCBvZiBhY3RpdmUgbGlxdWlkaXR5IHByb3ZpZGVycy4AAAAAAAAIbHBfY291bnQAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAO5SZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiB2YXVsdCBzaGFyZXMgdGhhdCBjYW4gYmUgbWludGVkCmZvciB0aGUgZ2l2ZW4gcmVjZWl2ZXIgYWRkcmVzcyAoY3VycmVudGx5IGBpMTI4OjpNQVhgKS4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byB0aGUgU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgcmVjZWl2ZXJgIC0gVGhlIGFkZHJlc3MgdGhhdCB3b3VsZCByZWNlaXZlIHRoZSB2YXVsdCBzaGFyZXMuAAAAAAAIbWF4X21pbnQAAAABAAAAAAAAAAhyZWNlaXZlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABQAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAId2l0aGRyYXcAAAAEAAAAAAAAAAZhc3NldHMAAAAAAAsAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAhvcGVyYXRvcgAAABMAAAABAAAACw==",
        "AAAAAAAAAPBSZXR1cm5zIHRoZSBhbW91bnQgb2YgdG9rZW5zIGEgYHNwZW5kZXJgIGlzIGFsbG93ZWQgdG8gc3BlbmQgb24gYmVoYWxmCm9mIGFuIGBvd25lcmAuCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgb3duZXJgIC0gVGhlIGFkZHJlc3MgaG9sZGluZyB0aGUgdG9rZW5zLgoqIGBzcGVuZGVyYCAtIFRoZSBhZGRyZXNzIGF1dGhvcml6ZWQgdG8gc3BlbmQgdGhlIHRva2Vucy4AAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAABAAAACw==",
        "AAAAAAAAADJSZXR1cm5zIHdoZXRoZXIgYGFjY291bnRgIGlzIG9uIHRoZSBLWUMgYWxsb3dsaXN0LgAAAAAACmlzX2FsbG93ZWQAAAAAAAEAAAAAAAAAB2FjY291bnQAAAAAEwAAAAEAAAAB",
        "AAAAAAAAAOVSZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiB2YXVsdCBzaGFyZXMgdGhhdCBjYW4gYmUgcmVkZWVtZWQKYnkgdGhlIGdpdmVuIG93bmVyIChlcXVhbCB0byB0aGVpciB2YXVsdCBzaGFyZSBiYWxhbmNlKS4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byB0aGUgU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgb3duZXJgIC0gVGhlIGFkZHJlc3MgdGhhdCBvd25zIHRoZSB2YXVsdCBzaGFyZXMuAAAAAAAACm1heF9yZWRlZW0AAAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAPZSZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiB1bmRlcmx5aW5nIGFzc2V0cyB0aGF0IGNhbiBiZSBkZXBvc2l0ZWQKZm9yIHRoZSBnaXZlbiByZWNlaXZlciBhZGRyZXNzIChjdXJyZW50bHkgYGkxMjg6Ok1BWGApLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIHRoZSBTb3JvYmFuIGVudmlyb25tZW50LgoqIGByZWNlaXZlcmAgLSBUaGUgYWRkcmVzcyB0aGF0IHdvdWxkIHJlY2VpdmUgdGhlIHZhdWx0IHNoYXJlcy4AAAAAAAttYXhfZGVwb3NpdAAAAAABAAAAAAAAAAhyZWNlaXZlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAQpSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSB1bmRlcmx5aW5nIGFzc2V0IHRoYXQgdGhlIHZhdWx0IG1hbmFnZXMuCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gdGhlIFNvcm9iYW4gZW52aXJvbm1lbnQuCgojIEVycm9ycwoKKiBbYGNyYXRlOjp2YXVsdDo6VmF1bHRUb2tlbkVycm9yOjpWYXVsdEFzc2V0QWRkcmVzc05vdFNldGBdIC0gV2hlbiB0aGUKdmF1bHQncyB1bmRlcmx5aW5nIGFzc2V0IGFkZHJlc3MgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkLgAAAAAAC3F1ZXJ5X2Fzc2V0AAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAa1SZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiB1bmRlcmx5aW5nIGFzc2V0cyB0aGF0IGNhbiBiZQp3aXRoZHJhd24gYnkgdGhlIGdpdmVuIG93bmVyLCBsaW1pdGVkIGJ5IHRoZWlyIHZhdWx0IHNoYXJlIGJhbGFuY2UuCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gdGhlIFNvcm9iYW4gZW52aXJvbm1lbnQuCiogYG93bmVyYCAtIFRoZSBhZGRyZXNzIHRoYXQgb3ducyB0aGUgdmF1bHQgc2hhcmVzLgoKIyBFcnJvcnMKCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6VmF1bHRJbnZhbGlkU2hhcmVzQW1vdW50YF0gLSBXaGVuCnNoYXJlcyA8IDAuCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6TWF0aE92ZXJmbG93YF0gLSBXaGVuIG1hdGhlbWF0aWNhbApvcGVyYXRpb25zIHJlc3VsdCBpbiBvdmVyZmxvdy4AAAAAAAAMbWF4X3dpdGhkcmF3AAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAapTaW11bGF0ZXMgYW5kIHJldHVybnMgdGhlIGFtb3VudCBvZiB1bmRlcmx5aW5nIGFzc2V0cyByZXF1aXJlZCB0byBtaW50CmEgZ2l2ZW4gYW1vdW50IG9mIHZhdWx0IHNoYXJlcyAocm91bmRlZCB1cCkuCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gdGhlIFNvcm9iYW4gZW52aXJvbm1lbnQuCiogYHNoYXJlc2AgLSBUaGUgYW1vdW50IG9mIHZhdWx0IHNoYXJlcyB0byBzaW11bGF0ZSBtaW50aW5nLgoKIyBFcnJvcnMKCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6VmF1bHRJbnZhbGlkU2hhcmVzQW1vdW50YF0gLSBXaGVuCnNoYXJlcyA8IDAuCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6TWF0aE92ZXJmbG93YF0gLSBXaGVuIG1hdGhlbWF0aWNhbApvcGVyYXRpb25zIHJlc3VsdCBpbiBvdmVyZmxvdy4AAAAAAAxwcmV2aWV3X21pbnQAAAABAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAABAAAACw==",
        "AAAAAAAAAYVSZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgb2YgdW5kZXJseWluZyBhc3NldHMgaGVsZCBieSB0aGUgdmF1bHQuCgpUaGlzIHJlcHJlc2VudHMgdGhlIHZhdWx0J3MgYmFsYW5jZSBvZiB0aGUgdW5kZXJseWluZyBhc3NldCwgd2hpY2gKZGV0ZXJtaW5lcyB0aGUgY29udmVyc2lvbiByYXRlIGJldHdlZW4gc2hhcmVzIGFuZCBhc3NldHMuCgojIEFyZ3VtZW50cwoKKiBgZWAgLSBBY2Nlc3MgdG8gdGhlIFNvcm9iYW4gZW52aXJvbm1lbnQuCgojIEVycm9ycwoKKiBbYGNyYXRlOjp2YXVsdDo6VmF1bHRUb2tlbkVycm9yOjpWYXVsdEFzc2V0QWRkcmVzc05vdFNldGBdIC0gV2hlbiB0aGUKdmF1bHQncyB1bmRlcmx5aW5nIGFzc2V0IGFkZHJlc3MgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkLgAAAAAAAAx0b3RhbF9hc3NldHMAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAGtSZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgb2YgdG9rZW5zIGluIGNpcmN1bGF0aW9uLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIHRoZSBTb3JvYmFuIGVudmlyb25tZW50LgAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
        "AAAAAAAAAMBJbml0aWFsaXplcyB0aGUgdmF1bHQuIFJ1bnMgb25jZSwgYXQgZGVwbG95IHRpbWUuCmBhc3NldGAgaXMgdGhlIHVuZGVybHlpbmcgdG9rZW4gKHRoZSBVU0RDIFNBQykgYW5kIHN0YXlzIGltbXV0YWJsZS4KYGFkbWluYCBiZWNvbWVzIHRoZSBvd25lcjogdGhlIGNvbXBsaWFuY2UgYWRtaW4gd2hvIG1hbmFnZXMgdGhlIGFsbG93bGlzdC4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAcJTaW11bGF0ZXMgYW5kIHJldHVybnMgdGhlIGFtb3VudCBvZiB1bmRlcmx5aW5nIGFzc2V0cyB0aGF0IHdvdWxkIGJlCnJlY2VpdmVkIGZvciByZWRlZW1pbmcgYSBnaXZlbiBhbW91bnQgb2YgdmF1bHQgc2hhcmVzIChyb3VuZGVkIGRvd24pLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIHRoZSBTb3JvYmFuIGVudmlyb25tZW50LgoqIGBzaGFyZXNgIC0gVGhlIGFtb3VudCBvZiB2YXVsdCBzaGFyZXMgdG8gc2ltdWxhdGUgcmVkZWVtaW5nLgoKIyBFcnJvcnMKCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6VmF1bHRJbnZhbGlkU2hhcmVzQW1vdW50YF0gLSBXaGVuCnNoYXJlcyA8IDAuCiogW2BjcmF0ZTo6dmF1bHQ6OlZhdWx0VG9rZW5FcnJvcjo6TWF0aE92ZXJmbG93YF0gLSBXaGVuIG1hdGhlbWF0aWNhbApvcGVyYXRpb25zIHJlc3VsdCBpbiBvdmVyZmxvdy4AAAAAAA5wcmV2aWV3X3JlZGVlbQAAAAAAAQAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAb1TaW11bGF0ZXMgYW5kIHJldHVybnMgdGhlIGFtb3VudCBvZiB2YXVsdCBzaGFyZXMgdGhhdCB3b3VsZCBiZSBtaW50ZWQKZm9yIGEgZ2l2ZW4gZGVwb3NpdCBvZiB1bmRlcmx5aW5nIGFzc2V0cyAocm91bmRlZCBkb3duKS4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byB0aGUgU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgYXNzZXRzYCAtIFRoZSBhbW91bnQgb2YgdW5kZXJseWluZyBhc3NldHMgdG8gc2ltdWxhdGUgZGVwb3NpdGluZy4KCiMgRXJyb3JzCgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6OlZhdWx0SW52YWxpZEFzc2V0c0Ftb3VudGBdIC0gV2hlbgphc3NldHMgPCAwLgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6Ok1hdGhPdmVyZmxvd2BdIC0gV2hlbiBtYXRoZW1hdGljYWwKb3BlcmF0aW9ucyByZXN1bHQgaW4gb3ZlcmZsb3cuAAAAAAAAD3ByZXZpZXdfZGVwb3NpdAAAAAABAAAAAAAAAAZhc3NldHMAAAAAAAsAAAABAAAACw==",
        "AAAAAAAAAcNTaW11bGF0ZXMgYW5kIHJldHVybnMgdGhlIGFtb3VudCBvZiB2YXVsdCBzaGFyZXMgdGhhdCB3b3VsZCBiZSBidXJuZWQKdG8gd2l0aGRyYXcgYSBnaXZlbiBhbW91bnQgb2YgdW5kZXJseWluZyBhc3NldHMgKHJvdW5kZWQgdXApLgoKIyBBcmd1bWVudHMKCiogYGVgIC0gQWNjZXNzIHRvIHRoZSBTb3JvYmFuIGVudmlyb25tZW50LgoqIGBhc3NldHNgIC0gVGhlIGFtb3VudCBvZiB1bmRlcmx5aW5nIGFzc2V0cyB0byBzaW11bGF0ZSB3aXRoZHJhd2luZy4KCiMgRXJyb3JzCgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6OlZhdWx0SW52YWxpZEFzc2V0c0Ftb3VudGBdIC0gV2hlbgphc3NldHMgPCAwLgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6Ok1hdGhPdmVyZmxvd2BdIC0gV2hlbiBtYXRoZW1hdGljYWwKb3BlcmF0aW9ucyByZXN1bHQgaW4gb3ZlcmZsb3cuAAAAABBwcmV2aWV3X3dpdGhkcmF3AAAAAQAAAAAAAAAGYXNzZXRzAAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAY5Db252ZXJ0cyBhbiBhbW91bnQgb2YgdmF1bHQgc2hhcmVzIHRvIHRoZSBlcXVpdmFsZW50IGFtb3VudCBvZgp1bmRlcmx5aW5nIGFzc2V0cyAocm91bmRlZCBkb3duKS4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byB0aGUgU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgc2hhcmVzYCAtIFRoZSBhbW91bnQgb2YgdmF1bHQgc2hhcmVzIHRvIGNvbnZlcnQuCgojIEVycm9ycwoKKiBbYGNyYXRlOjp2YXVsdDo6VmF1bHRUb2tlbkVycm9yOjpWYXVsdEludmFsaWRTaGFyZXNBbW91bnRgXSAtIFdoZW4Kc2hhcmVzIDwgMC4KKiBbYGNyYXRlOjp2YXVsdDo6VmF1bHRUb2tlbkVycm9yOjpNYXRoT3ZlcmZsb3dgXSAtIFdoZW4gbWF0aGVtYXRpY2FsCm9wZXJhdGlvbnMgcmVzdWx0IGluIG92ZXJmbG93LgAAAAAAEWNvbnZlcnRfdG9fYXNzZXRzAAAAAAAAAQAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAZNDb252ZXJ0cyBhbiBhbW91bnQgb2YgdW5kZXJseWluZyBhc3NldHMgdG8gdGhlIGVxdWl2YWxlbnQgYW1vdW50IG9mCnZhdWx0IHNoYXJlcyAocm91bmRlZCBkb3duKS4KCiMgQXJndW1lbnRzCgoqIGBlYCAtIEFjY2VzcyB0byB0aGUgU29yb2JhbiBlbnZpcm9ubWVudC4KKiBgYXNzZXRzYCAtIFRoZSBhbW91bnQgb2YgdW5kZXJseWluZyBhc3NldHMgdG8gY29udmVydC4KCiMgRXJyb3JzCgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6OlZhdWx0SW52YWxpZEFzc2V0c0Ftb3VudGBdIC0gV2hlbgphc3NldHMgPCAwLgoqIFtgY3JhdGU6OnZhdWx0OjpWYXVsdFRva2VuRXJyb3I6Ok1hdGhPdmVyZmxvd2BdIC0gV2hlbiBtYXRoZW1hdGljYWwKb3BlcmF0aW9ucyByZXN1bHQgaW4gb3ZlcmZsb3cuAAAAABFjb252ZXJ0X3RvX3NoYXJlcwAAAAAAAAEAAAAAAAAABmFzc2V0cwAAAAAACwAAAAEAAAAL",
        "AAAABAAAAAAAAAAAAAAADE93bmFibGVFcnJvcgAAAAMAAAAAAAAAC093bmVyTm90U2V0AAAACDQAAAAAAAAAElRyYW5zZmVySW5Qcm9ncmVzcwAAAAAINQAAAAAAAAAPT3duZXJBbHJlYWR5U2V0AAAACDY=",
        "AAAABAAAAAAAAAAAAAAAFlNvcm9iYW5GaXhlZFBvaW50RXJyb3IAAAAAAAIAAAAcQXJpdGhtZXRpYyBvdmVyZmxvdyBvY2N1cnJlZAAAAAhPdmVyZmxvdwAABdwAAAAQRGl2aXNpb24gYnkgemVybwAAAA5EaXZpc2lvbkJ5WmVybwAAAAAF3Q==",
        "AAAABQAAAEJFdmVudCBlbWl0dGVkIHdoZW4gdW5kZXJseWluZyBhc3NldHMgYXJlIGRlcG9zaXRlZCBpbnRvIHRoZSB2YXVsdC4AAAAAAAAAAAAHRGVwb3NpdAAAAAABAAAAB2RlcG9zaXQAAAAABQAAAAAAAAAIb3BlcmF0b3IAAAATAAAAAQAAAAAAAAAEZnJvbQAAABMAAAABAAAAAAAAAAhyZWNlaXZlcgAAABMAAAABAAAAAAAAAAZhc3NldHMAAAAAAAsAAAAAAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAAAg==",
        "AAAABQAAAENFdmVudCBlbWl0dGVkIHdoZW4gc2hhcmVzIGFyZSBleGNoYW5nZWQgYmFjayBmb3IgdW5kZXJseWluZyBhc3NldHMuAAAAAAAAAAAIV2l0aGRyYXcAAAABAAAACHdpdGhkcmF3AAAABQAAAAAAAAAIb3BlcmF0b3IAAAATAAAAAQAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAAAAAAGYXNzZXRzAAAAAAALAAAAAAAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAAAAAAI=",
        "AAAABAAAAAAAAAAAAAAAD1ZhdWx0VG9rZW5FcnJvcgAAAAALAAAANkluZGljYXRlcyBhY2Nlc3MgdG8gdW5pbml0aWFsaXplZCB2YXVsdCBhc3NldCBhZGRyZXNzLgAAAAAAF1ZhdWx0QXNzZXRBZGRyZXNzTm90U2V0AAAAAZAAAAAySW5kaWNhdGVzIHRoYXQgdmF1bHQgYXNzZXQgYWRkcmVzcyBpcyBhbHJlYWR5IHNldC4AAAAAABtWYXVsdEFzc2V0QWRkcmVzc0FscmVhZHlTZXQAAAABkQAAADxJbmRpY2F0ZXMgdGhhdCB2YXVsdCB2aXJ0dWFsIGRlY2ltYWxzIG9mZnNldCBpcyBhbHJlYWR5IHNldC4AAAAkVmF1bHRWaXJ0dWFsRGVjaW1hbHNPZmZzZXRBbHJlYWR5U2V0AAABkgAAADdJbmRpY2F0ZXMgdGhlIGFtb3VudCBpcyBub3QgYSB2YWxpZCB2YXVsdCBhc3NldHMgdmFsdWUuAAAAABhWYXVsdEludmFsaWRBc3NldHNBbW91bnQAAAGTAAAAN0luZGljYXRlcyB0aGUgYW1vdW50IGlzIG5vdCBhIHZhbGlkIHZhdWx0IHNoYXJlcyB2YWx1ZS4AAAAAGFZhdWx0SW52YWxpZFNoYXJlc0Ftb3VudAAAAZQAAABBQXR0ZW1wdGVkIHRvIGRlcG9zaXQgbW9yZSBhc3NldHMgdGhhbiB0aGUgbWF4IGFtb3VudCBmb3IgYWRkcmVzcy4AAAAAAAAXVmF1bHRFeGNlZWRlZE1heERlcG9zaXQAAAABlQAAAD5BdHRlbXB0ZWQgdG8gbWludCBtb3JlIHNoYXJlcyB0aGFuIHRoZSBtYXggYW1vdW50IGZvciBhZGRyZXNzLgAAAAAAFFZhdWx0RXhjZWVkZWRNYXhNaW50AAABlgAAAEJBdHRlbXB0ZWQgdG8gd2l0aGRyYXcgbW9yZSBhc3NldHMgdGhhbiB0aGUgbWF4IGFtb3VudCBmb3IgYWRkcmVzcy4AAAAAABhWYXVsdEV4Y2VlZGVkTWF4V2l0aGRyYXcAAAGXAAAAQEF0dGVtcHRlZCB0byByZWRlZW0gbW9yZSBzaGFyZXMgdGhhbiB0aGUgbWF4IGFtb3VudCBmb3IgYWRkcmVzcy4AAAAWVmF1bHRFeGNlZWRlZE1heFJlZGVlbQAAAAABmAAAACpNYXhpbXVtIG51bWJlciBvZiBkZWNpbWFscyBvZmZzZXQgZXhjZWVkZWQAAAAAAB5WYXVsdE1heERlY2ltYWxzT2Zmc2V0RXhjZWVkZWQAAAAAAZkAAAAxSW5kaWNhdGVzIG92ZXJmbG93IGR1ZSB0byBtYXRoZW1hdGljYWwgb3BlcmF0aW9ucwAAAAAAAAxNYXRoT3ZlcmZsb3cAAAGa",
        "AAAABQAAADhFdmVudCBlbWl0dGVkIHdoZW4gYSB1c2VyIGlzIGFsbG93ZWQgdG8gdHJhbnNmZXIgdG9rZW5zLgAAAAAAAAALVXNlckFsbG93ZWQAAAAAAQAAAAx1c2VyX2FsbG93ZWQAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAAC",
        "AAAABQAAAEFFdmVudCBlbWl0dGVkIHdoZW4gYSB1c2VyIGlzIGRpc2FsbG93ZWQgZnJvbSB0cmFuc2ZlcnJpbmcgdG9rZW5zLgAAAAAAAAAAAAAOVXNlckRpc2FsbG93ZWQAAAAAAAEAAAAPdXNlcl9kaXNhbGxvd2VkAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAI=",
        "AAAABQAAACxFdmVudCBlbWl0dGVkIHdoZW4gYW4gYWxsb3dhbmNlIGlzIGFwcHJvdmVkLgAAAAAAAAAHQXBwcm92ZQAAAAABAAAAB2FwcHJvdmUAAAAABAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAARbGl2ZV91bnRpbF9sZWRnZXIAAAAAAAAEAAAAAAAAAAI=",
        "AAAABQAAASFFdmVudCBlbWl0dGVkIHdoZW4gdG9rZW5zIGFyZSB0cmFuc2ZlcnJlZCBiZXR3ZWVuIGFkZHJlc3NlcyB3aXRob3V0IGEKbXV4ZWQgZGVzdGluYXRpb24uCgpQZXIgU0VQLTQxLCB0aGUgZXZlbnQgZGF0YSBpcyBhIGJhcmUgYGkxMjhgIHdoZW4gbm8gbXV4ZWQgYWRkcmVzcyBpcwppbnZvbHZlZC4gVGhlIGBkYXRhX2Zvcm1hdCA9ICJzaW5nbGUtdmFsdWUiYCBhdHRyaWJ1dGUgZW5zdXJlcyB0aGUKYGFtb3VudGAgZmllbGQgaXMgc2VyaWFsaXplZCBhcyBhIGJhcmUgdmFsdWUgcmF0aGVyIHRoYW4gYSBtYXAuAAAAAAAAAAAAAAhUcmFuc2ZlcgAAAAEAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAEAAAAAAAAAAnRvAAAAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAA=",
        "AAAABQAAAZdFdmVudCBlbWl0dGVkIHdoZW4gdG9rZW5zIGFyZSB0cmFuc2ZlcnJlZCB0byBhIG11eGVkIGFkZHJlc3MuCgpQZXIgU0VQLTQxLCB3aGVuIHRoZSBkZXN0aW5hdGlvbiBpcyBhIFtgTXV4ZWRBZGRyZXNzYF0gdGhlIGV2ZW50IGRhdGEKY2FycmllcyBib3RoIHRoZSBhbW91bnQgYW5kIHRoZSBtdXhlZCBpZGVudGlmaWVyIHNvIHRoYXQgb2ZmLWNoYWluCmNvbnN1bWVycyBjYW4gYXR0cmlidXRlIHRoZSB0cmFuc2ZlciB0byB0aGUgY29ycmVjdCBzdWItYWNjb3VudC4KClVzZXMgYHRvcGljcyA9IFsidHJhbnNmZXIiXWAgc28gdGhhdCBib3RoIFtgVHJhbnNmZXJgXSBhbmQKW2BNdXhlZFRyYW5zZmVyYF0gc2hhcmUgdGhlIHNhbWUgYCJ0cmFuc2ZlciJgIGV2ZW50IHN5bWJvbCwgYXMgcmVxdWlyZWQKYnkgU0VQLTQxLgAAAAAAAAAADU11eGVkVHJhbnNmZXIAAAAAAAABAAAACHRyYW5zZmVyAAAABAAAAAAAAAAEZnJvbQAAABMAAAABAAAAAAAAAAJ0bwAAAAAAEwAAAAEAAAAAAAAAC3RvX211eGVkX2lkAAAAA+gAAAAGAAAAAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABAAAAAAAAAAAAAAAEkZ1bmdpYmxlVG9rZW5FcnJvcgAAAAAADwAAAG5JbmRpY2F0ZXMgYW4gZXJyb3IgcmVsYXRlZCB0byB0aGUgY3VycmVudCBiYWxhbmNlIG9mIGFjY291bnQgZnJvbSB3aGljaAp0b2tlbnMgYXJlIGV4cGVjdGVkIHRvIGJlIHRyYW5zZmVycmVkLgAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAAZAAAAGRJbmRpY2F0ZXMgYSBmYWlsdXJlIHdpdGggdGhlIGFsbG93YW5jZSBtZWNoYW5pc20gd2hlbiBhIGdpdmVuIHNwZW5kZXIKZG9lc24ndCBoYXZlIGVub3VnaCBhbGxvd2FuY2UuAAAAFUluc3VmZmljaWVudEFsbG93YW5jZQAAAAAAAGUAAABNSW5kaWNhdGVzIGFuIGludmFsaWQgdmFsdWUgZm9yIGBsaXZlX3VudGlsX2xlZGdlcmAgd2hlbiBzZXR0aW5nIGFuCmFsbG93YW5jZS4AAAAAAAAWSW52YWxpZExpdmVVbnRpbExlZGdlcgAAAAAAZgAAADJJbmRpY2F0ZXMgYW4gZXJyb3Igd2hlbiBhbiBpbnB1dCB0aGF0IG11c3QgYmUgPj0gMAAAAAAADExlc3NUaGFuWmVybwAAAGcAAAApSW5kaWNhdGVzIG92ZXJmbG93IHdoZW4gYWRkaW5nIHR3byB2YWx1ZXMAAAAAAAAMTWF0aE92ZXJmbG93AAAAaAAAACpJbmRpY2F0ZXMgYWNjZXNzIHRvIHVuaW5pdGlhbGl6ZWQgbWV0YWRhdGEAAAAAAA1VbnNldE1ldGFkYXRhAAAAAAAAaQAAAFJJbmRpY2F0ZXMgdGhhdCB0aGUgb3BlcmF0aW9uIHdvdWxkIGhhdmUgY2F1c2VkIGB0b3RhbF9zdXBwbHlgIHRvIGV4Y2VlZAp0aGUgYGNhcGAuAAAAAAALRXhjZWVkZWRDYXAAAAAAagAAADZJbmRpY2F0ZXMgdGhlIHN1cHBsaWVkIGBjYXBgIGlzIG5vdCBhIHZhbGlkIGNhcCB2YWx1ZS4AAAAAAApJbnZhbGlkQ2FwAAAAAABrAAAAHkluZGljYXRlcyB0aGUgQ2FwIHdhcyBub3Qgc2V0LgAAAAAACUNhcE5vdFNldAAAAAAAAGwAAAAmSW5kaWNhdGVzIHRoZSBTQUMgYWRkcmVzcyB3YXMgbm90IHNldC4AAAAAAAlTQUNOb3RTZXQAAAAAAABtAAAAMEluZGljYXRlcyBhIFNBQyBhZGRyZXNzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkLgAAABJTQUNBZGRyZXNzTWlzbWF0Y2gAAAAAAG4AAABDSW5kaWNhdGVzIGEgbWlzc2luZyBmdW5jdGlvbiBwYXJhbWV0ZXIgaW4gdGhlIFNBQyBjb250cmFjdCBjb250ZXh0LgAAAAARU0FDTWlzc2luZ0ZuUGFyYW0AAAAAAABvAAAAREluZGljYXRlcyBhbiBpbnZhbGlkIGZ1bmN0aW9uIHBhcmFtZXRlciBpbiB0aGUgU0FDIGNvbnRyYWN0IGNvbnRleHQuAAAAEVNBQ0ludmFsaWRGblBhcmFtAAAAAAAAcAAAADFUaGUgdXNlciBpcyBub3QgYWxsb3dlZCB0byBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAADlVzZXJOb3RBbGxvd2VkAAAAAABxAAAANVRoZSB1c2VyIGlzIGJsb2NrZWQgYW5kIGNhbm5vdCBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAAC1VzZXJCbG9ja2VkAAAAAHI=" ]),
      options
    )
  }
  public readonly fromJSON = {
    mint: this.txFromJSON<i128>,
        name: this.txFromJSON<string>,
        allow: this.txFromJSON<null>,
        redeem: this.txFromJSON<i128>,
        symbol: this.txFromJSON<string>,
        approve: this.txFromJSON<null>,
        balance: this.txFromJSON<i128>,
        deposit: this.txFromJSON<i128>,
        decimals: this.txFromJSON<u32>,
        disallow: this.txFromJSON<null>,
        lp_count: this.txFromJSON<u32>,
        max_mint: this.txFromJSON<i128>,
        transfer: this.txFromJSON<null>,
        withdraw: this.txFromJSON<i128>,
        allowance: this.txFromJSON<i128>,
        is_allowed: this.txFromJSON<boolean>,
        max_redeem: this.txFromJSON<i128>,
        max_deposit: this.txFromJSON<i128>,
        query_asset: this.txFromJSON<string>,
        max_withdraw: this.txFromJSON<i128>,
        preview_mint: this.txFromJSON<i128>,
        total_assets: this.txFromJSON<i128>,
        total_supply: this.txFromJSON<i128>,
        transfer_from: this.txFromJSON<null>,
        preview_redeem: this.txFromJSON<i128>,
        preview_deposit: this.txFromJSON<i128>,
        preview_withdraw: this.txFromJSON<i128>,
        convert_to_assets: this.txFromJSON<i128>,
        convert_to_shares: this.txFromJSON<i128>
  }
}