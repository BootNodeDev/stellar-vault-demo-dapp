// Vault deployment whose source_account is the gov multisig (2-of-3,
// med_threshold=2). The admin page only ever targets this contract — pinned
// here so adminTx.ts, and any test/tooling, reference one source of truth
// instead of re-typing the address.
export const ADMIN_VAULT_CONTRACT_ID =
	"CAKZLKMWWVFUAGGVGX5EI6F3AOZEORSNM4D2POBSU7DXD3ISRXIIVW42"
