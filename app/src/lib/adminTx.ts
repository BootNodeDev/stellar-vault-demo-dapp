// Sole rpc I/O module for the admin flow. Everything else in `src/lib` is
// pure/testable; this file isolates the network calls (build, simulate,
// assemble, submit) that can't be unit-tested without a live RPC endpoint —
// verified manually against testnet instead (see design.md § Testing Strategy).

import {
	BASE_FEE,
	Contract,
	nativeToScVal,
	rpc,
	scValToNative,
	Transaction,
	TransactionBuilder,
} from "@stellar/stellar-sdk"
import { networkPassphrase, rpcUrl } from "@stellar-scaffold/app-lib"
import { ADMIN_ACCOUNT, ADMIN_VAULT_CONTRACT_ID } from "./adminConfig"

export type AdminOp = "allow" | "disallow"

export interface AdminTxSummary {
	op: AdminOp
	target: string
	source: string
	maxTime: number
}

// Generous enough for an async multi-party signing round to complete, bounded
// so a stale, unsubmitted admin tx doesn't stay valid indefinitely.
const TX_TIMEOUT_SECONDS = 24 * 60 * 60

function server(): rpc.Server {
	return new rpc.Server(rpcUrl)
}

/**
 * Builds an `allow`/`disallow` invoke with the gov account as source, then
 * simulates and assembles it via RPC. Returns unsigned XDR — no signing
 * happens here; the composer isn't necessarily one of the gov signers.
 */
export async function buildAdminTx(
	op: AdminOp,
	target: string,
): Promise<string> {
	const account = await server().getAccount(ADMIN_ACCOUNT)
	const contract = new Contract(ADMIN_VAULT_CONTRACT_ID)
	const tx = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase,
	})
		.addOperation(contract.call(op, nativeToScVal(target, { type: "address" })))
		.setTimeout(TX_TIMEOUT_SECONDS)
		.build()

	const prepared = await server().prepareTransaction(tx)
	return prepared.toXDR()
}

/**
 * Reads the op name, target address, source account, and expiry off an
 * assembled envelope — pure XDR parsing, no I/O — so the sign-round view can
 * display what it's about to sign before the wallet prompt fires.
 */
export function describeAdminTx(xdr: string): AdminTxSummary {
	const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
	if (!(tx instanceof Transaction)) {
		throw new Error("Invalid admin link: fee-bump envelopes are not supported")
	}

	const [operation] = tx.operations
	if (!operation || operation.type !== "invokeHostFunction") {
		throw new Error(
			"Invalid admin link: expected a single contract invoke operation",
		)
	}

	const invokeArgs = operation.func.invokeContract()
	const rawName = invokeArgs.functionName()
	const op = (
		typeof rawName === "string" ? rawName : rawName.toString()
	) as AdminOp
	if (op !== "allow" && op !== "disallow") {
		throw new Error(`Invalid admin link: unexpected function "${op}"`)
	}

	const [targetArg] = invokeArgs.args()
	if (!targetArg) {
		throw new Error("Invalid admin link: missing target argument")
	}

	return {
		op,
		target: scValToNative(targetArg) as string,
		source: tx.source,
		maxTime: Number(tx.timeBounds?.maxTime ?? 0),
	}
}

/**
 * Sends an assembled, sufficiently-signed transaction envelope via RPC.
 */
export async function submitAdminTx(xdr: string): Promise<string> {
	const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
	const result = await server().sendTransaction(tx)
	if (result.status === "ERROR") {
		throw new Error(
			`Submit failed: ${result.errorResult?.toString() ?? "unknown error"}`,
		)
	}
	return result.hash
}
