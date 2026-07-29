import {
	Account,
	BASE_FEE,
	Keypair,
	Networks,
	Operation,
	TransactionBuilder,
} from "@stellar/stellar-sdk"
import { describe, expect, it } from "vitest"
import { mergeSignatures } from "./txSignatures"

function buildUnsignedXdr(): string {
	const sourceKeypair = Keypair.random()
	const account = new Account(sourceKeypair.publicKey(), "1")
	const tx = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(Operation.bumpSequence({ bumpTo: "2" }))
		.setTimeout(30)
		.build()
	return tx.toXDR()
}

function decodeSignatureCount(xdr: string): number {
	return TransactionBuilder.fromXDR(xdr, Networks.TESTNET).signatures.length
}

describe("mergeSignatures", () => {
	it("preserves the prior signature already present on the base envelope", () => {
		const baseXdr = buildUnsignedXdr()
		const signerA = Keypair.random()
		const signerB = Keypair.random()

		const baseTx = TransactionBuilder.fromXDR(baseXdr, Networks.TESTNET)
		baseTx.sign(signerA)
		const roundOneXdr = baseTx.toXDR()

		const roundOneTx = TransactionBuilder.fromXDR(roundOneXdr, Networks.TESTNET)
		roundOneTx.sign(signerB)
		const roundTwoXdr = roundOneTx.toXDR()

		const mergedXdr = mergeSignatures(
			roundOneXdr,
			roundTwoXdr,
			Networks.TESTNET,
		)
		const merged = TransactionBuilder.fromXDR(mergedXdr, Networks.TESTNET)

		const hints = merged.signatures.map((sig) => sig.hint().toString("hex"))
		expect(hints).toContain(signerA.signatureHint().toString("hex"))
		expect(hints).toContain(signerB.signatureHint().toString("hex"))
	})

	it("does not duplicate a signature present on both sides", () => {
		const baseXdr = buildUnsignedXdr()
		const signer = Keypair.random()
		const tx = TransactionBuilder.fromXDR(baseXdr, Networks.TESTNET)
		tx.sign(signer)
		const signedXdr = tx.toXDR()

		const mergedXdr = mergeSignatures(signedXdr, signedXdr, Networks.TESTNET)
		expect(decodeSignatureCount(mergedXdr)).toBe(1)
	})

	it("merges two disjoint single-signer rounds into two signatures total", () => {
		const baseXdr = buildUnsignedXdr()
		const signerA = Keypair.random()
		const signerB = Keypair.random()

		const txA = TransactionBuilder.fromXDR(baseXdr, Networks.TESTNET)
		txA.sign(signerA)
		const xdrA = txA.toXDR()

		const txB = TransactionBuilder.fromXDR(baseXdr, Networks.TESTNET)
		txB.sign(signerB)
		const xdrB = txB.toXDR()

		const mergedXdr = mergeSignatures(xdrA, xdrB, Networks.TESTNET)
		expect(decodeSignatureCount(mergedXdr)).toBe(2)
	})

	it("keeps an unrecognized signature instead of silently dropping it", () => {
		const baseXdr = buildUnsignedXdr()
		const knownSigner = Keypair.random()
		const outsider = Keypair.random()

		const baseTx = TransactionBuilder.fromXDR(baseXdr, Networks.TESTNET)
		baseTx.sign(knownSigner)
		const roundOneXdr = baseTx.toXDR()

		const roundOneTx = TransactionBuilder.fromXDR(roundOneXdr, Networks.TESTNET)
		roundOneTx.sign(outsider)
		const roundTwoXdr = roundOneTx.toXDR()

		const mergedXdr = mergeSignatures(
			roundOneXdr,
			roundTwoXdr,
			Networks.TESTNET,
		)
		const merged = TransactionBuilder.fromXDR(mergedXdr, Networks.TESTNET)
		const hints = merged.signatures.map((sig) => sig.hint().toString("hex"))

		expect(hints).toContain(outsider.signatureHint().toString("hex"))
		expect(merged.signatures).toHaveLength(2)
	})
})
