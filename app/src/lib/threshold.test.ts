import {
	Account,
	BASE_FEE,
	Keypair,
	Networks,
	Operation,
	type Transaction,
	TransactionBuilder,
} from "@stellar/stellar-sdk"
import { describe, expect, it } from "vitest"
import { computeCollected } from "./threshold"

function buildUnsignedTx(): Transaction {
	const sourceKeypair = Keypair.random()
	const account = new Account(sourceKeypair.publicKey(), "1")
	return new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(Operation.bumpSequence({ bumpTo: "2" }))
		.setTimeout(30)
		.build()
}

describe("computeCollected", () => {
	const [signerA, signerB, signerC] = [
		Keypair.random(),
		Keypair.random(),
		Keypair.random(),
	]
	const signers = [
		{ key: signerA.publicKey(), weight: 1 },
		{ key: signerB.publicKey(), weight: 1 },
		{ key: signerC.publicKey(), weight: 1 },
	]
	const medThreshold = 2

	it("returns weight 0 and met=false for an unsigned envelope", () => {
		const tx = buildUnsignedTx()
		const result = computeCollected(tx, signers, medThreshold)
		expect(result).toEqual({ weight: 0, met: false, perSigner: [] })
	})

	it("is below threshold with a single signer", () => {
		const tx = buildUnsignedTx()
		tx.sign(signerA)
		const result = computeCollected(tx, signers, medThreshold)
		expect(result.weight).toBe(1)
		expect(result.met).toBe(false)
	})

	it("meets threshold exactly at medThreshold", () => {
		const tx = buildUnsignedTx()
		tx.sign(signerA)
		tx.sign(signerB)
		const result = computeCollected(tx, signers, medThreshold)
		expect(result.weight).toBe(2)
		expect(result.met).toBe(true)
	})

	it("exceeds threshold when every signer signs", () => {
		const tx = buildUnsignedTx()
		tx.sign(signerA)
		tx.sign(signerB)
		tx.sign(signerC)
		const result = computeCollected(tx, signers, medThreshold)
		expect(result.weight).toBe(3)
		expect(result.met).toBe(true)
	})

	it("does not double count a duplicated signature from the same signer", () => {
		const tx = buildUnsignedTx()
		tx.sign(signerA)
		const duplicatedSignature = tx.signatures[0]
		if (!duplicatedSignature) throw new Error("test setup: no signature")
		tx.signatures.push(duplicatedSignature)

		const result = computeCollected(tx, signers, medThreshold)
		expect(result.weight).toBe(1)
		expect(result.perSigner).toHaveLength(1)
	})

	it("gives 0 weight to a signature from a key absent from signers", () => {
		const outsider = Keypair.random()
		const tx = buildUnsignedTx()
		tx.sign(signerA)
		tx.sign(outsider)

		const result = computeCollected(tx, signers, medThreshold)
		expect(result.weight).toBe(1)
		expect(result.perSigner).toEqual([{ key: signerA.publicKey(), weight: 1 }])
	})
})
