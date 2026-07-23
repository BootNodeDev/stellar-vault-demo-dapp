import {
	Keypair,
	type FeeBumpTransaction,
	type Transaction,
} from "@stellar/stellar-sdk"

export interface AccountSigner {
	key: string
	weight: number
}

export interface SignerWeight {
	key: string
	weight: number
}

export interface CollectedWeight {
	weight: number
	met: boolean
	perSigner: SignerWeight[]
}

/**
 * Computes the multisig weight collected so far on a transaction envelope.
 *
 * Each signer's key is verified against the envelope's signatures using the
 * transaction hash — matching by actual signature validity (not just the
 * 4-byte hint) so a signer can only be credited once, and an unrelated
 * signature never contributes weight.
 */
export function computeCollected(
	envelope: Transaction | FeeBumpTransaction,
	signers: AccountSigner[],
	medThreshold: number,
): CollectedWeight {
	const txHash = envelope.hash()
	const unmatchedSignatures = [...envelope.signatures]
	const perSigner: SignerWeight[] = []

	for (const signer of signers) {
		const keypair = Keypair.fromPublicKey(signer.key)
		const matchIndex = unmatchedSignatures.findIndex((sig) =>
			keypair.verify(txHash, sig.signature()),
		)
		if (matchIndex === -1) continue

		unmatchedSignatures.splice(matchIndex, 1)
		perSigner.push({ key: signer.key, weight: signer.weight })
	}

	const weight = perSigner.reduce((sum, signer) => sum + signer.weight, 0)
	return { weight, met: weight >= medThreshold, perSigner }
}
