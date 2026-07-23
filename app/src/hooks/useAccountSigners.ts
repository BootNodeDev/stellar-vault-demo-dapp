import * as StellarSdk from "@stellar/stellar-sdk"
import { horizonUrl } from "@stellar-scaffold/app-lib"
import { useQuery } from "@tanstack/react-query"
import { ADMIN_ACCOUNT } from "../lib/adminConfig"
import { type AccountSigner } from "../lib/threshold"

export interface AccountSigners {
	signers: AccountSigner[]
	medThreshold: number
}

/**
 * Loads the gov account's signers and thresholds from Horizon — the data
 * `threshold.ts`'s `computeCollected` needs to score a signature round.
 */
export function useAccountSigners() {
	return useQuery<AccountSigners>({
		queryKey: ["admin-account-signers"],
		queryFn: async () => {
			const server = new StellarSdk.Horizon.Server(horizonUrl)
			const account = await server.loadAccount(ADMIN_ACCOUNT)

			return {
				signers: account.signers.map((signer) => ({
					key: signer.key,
					weight: signer.weight,
				})),
				medThreshold: account.thresholds.med_threshold,
			}
		},
	})
}
