// These ids are testnet-pinned; a mainnet target would need a network-keyed lookup.
//
// Vault deployment whose source_account is the gov multisig (2-of-3,
// med_threshold=2). The admin page only ever targets this contract — pinned
// here so adminTx.ts, and any test/tooling, reference one source of truth
// instead of re-typing the address.
export const ADMIN_VAULT_CONTRACT_ID =
	"CD5RPBZ6JK5RHJD2JFXCGKFSD7X7HSXCZGE7NNJLOEANPJQQHS57JTGK"

// The gov multisig account itself — transaction source for `allow`/`disallow`
// invokes, and the account whose signers/thresholds gate the admin flow.
export const ADMIN_ACCOUNT =
	"GDVL4VKURSZ7R66IWAORMUNHYHHDQ5Y65TMPWIGV6WDVKTRZZLQBYNXQ"
