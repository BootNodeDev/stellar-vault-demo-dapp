import { useAccountSigners } from "./useAccountSigners"
import { useWallet } from "./useWallet"

/**
 * A wallet is "admin" when it is a signer of the gov multisig account that owns
 * the vault. This gates the admin UI surface only — it is not a security
 * boundary. Real authority is enforced on-chain by the contract's `require_auth`
 * against gov's signer weights and thresholds.
 */
export function useIsAdmin() {
	const { address } = useWallet()
	const { data, isLoading } = useAccountSigners()
	const isAdmin = Boolean(
		address && data?.signers.some((signer) => signer.key === address),
	)
	return { isAdmin, isLoading, address }
}
