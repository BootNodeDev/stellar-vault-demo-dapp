import { network } from "@stellar-scaffold/app-lib"
import { Client } from "vault"
import { ADMIN_VAULT_CONTRACT_ID } from "@/lib/adminConfig"

// Single source of truth for the vault the whole app talks to (dashboard reads,
// deposit/withdraw, and — implicitly — the same contract the admin console
// targets via ADMIN_VAULT_CONTRACT_ID).
//
// We deliberately do NOT use the auto-generated `@stellar-scaffold/app-lib/clients`
// singleton: scaffold regenerates that file and its baked contractId had drifted
// to the old pre-allowlist vault, so the dashboard read one contract while the
// admin console wrote to another. Pinning here keeps them in lockstep.
export const vault = new Client({
	networkPassphrase: network.passphrase,
	rpcUrl: network.rpcUrl,
	allowHttp: network.id === "local",
	contractId: ADMIN_VAULT_CONTRACT_ID,
})
