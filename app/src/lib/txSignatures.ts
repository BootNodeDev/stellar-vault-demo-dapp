import { TransactionBuilder, type xdr } from "@stellar/stellar-sdk"

function signatureKey(sig: xdr.DecoratedSignature): string {
	return `${sig.hint().toString("hex")}:${sig.signature().toString("hex")}`
}

function dedupeSignatures(
	signatures: xdr.DecoratedSignature[],
): xdr.DecoratedSignature[] {
	const seen = new Set<string>()
	const result: xdr.DecoratedSignature[] = []

	for (const sig of signatures) {
		const key = signatureKey(sig)
		if (seen.has(key)) continue
		seen.add(key)
		result.push(sig)
	}

	return result
}

/**
 * Merges the signatures of two envelopes that share the same underlying
 * transaction body (e.g. a base round and a just-signed round from a
 * wallet), preserving every prior signature and deduping byte-identical
 * ones. Unrecognized signatures are kept as-is — weight/validity is
 * threshold.ts's concern, not this module's.
 */
export function mergeSignatures(
	baseXdr: string,
	signedXdr: string,
	networkPassphrase: string,
): string {
	const base = TransactionBuilder.fromXDR(baseXdr, networkPassphrase)
	const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)

	const merged = dedupeSignatures([...base.signatures, ...signed.signatures])
	// `.signatures` has no setter (the SDK throws "Transaction is immutable"
	// on reassignment) — mutate the live array in place instead.
	base.signatures.length = 0
	for (const sig of merged) {
		base.signatures.push(sig)
	}

	return base.toXDR()
}
