import { CircleNotch, SealCheck, ShieldCheck } from "@phosphor-icons/react"
import * as StellarSdk from "@stellar/stellar-sdk"
import { networkPassphrase } from "@stellar-scaffold/app-lib"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAccountSigners } from "../hooks/useAccountSigners"
import { useIsAdmin } from "../hooks/useIsAdmin"
import { useWallet } from "../hooks/useWallet"
import { decodeAdminLink, encodeAdminLink } from "../lib/adminLink"
import {
	buildAdminTx,
	describeAdminTx,
	submitAdminTx,
	type AdminOp,
	type AdminTxSummary,
} from "../lib/adminTx"
import { computeCollected } from "../lib/threshold"
import { mergeSignatures } from "../lib/txSignatures"

type Status = { state: "idle" | "pending" | "success" | "error"; msg?: string }

function isValidStellarAddress(value: string): boolean {
	return (
		StellarSdk.StrKey.isValidEd25519PublicKey(value) ||
		StellarSdk.StrKey.isValidContract(value)
	)
}

function adminLinkFor(xdr: string): string {
	return `${window.location.origin}/admin${encodeAdminLink(xdr).hash}`
}

export default function AdminPage() {
	const { hash } = useLocation()
	const { isAdmin, isLoading, address } = useIsAdmin()

	function content() {
		if (isLoading) {
			return <p className="muted">Checking admin access…</p>
		}
		if (!isAdmin) {
			return (
				<p className="muted">
					{address
						? "This wallet is not a signer of the vault's gov account. Connect an admin wallet to manage the allowlist."
						: "Connect an admin wallet (a gov multisig signer) to manage the allowlist."}
				</p>
			)
		}
		return hash.startsWith("#tx=") ? <SignView hash={hash} /> : <ComposeView />
	}

	return (
		<div>
			<header className="vhead">
				<h1>Vault Admin — Allowlist</h1>
				<p>
					Compose an <span className="mono">allow</span>/
					<span className="mono">disallow</span> operation for the gov multisig
					(2-of-3), or continue an in-progress signing round from a shared link.
				</p>
			</header>

			<section className="panel">{content()}</section>
		</div>
	)
}

function ComposeView() {
	const navigate = useNavigate()
	const [op, setOp] = useState<AdminOp>("allow")
	const [target, setTarget] = useState("")
	const [addressError, setAddressError] = useState<string | null>(null)
	const [status, setStatus] = useState<Status>({ state: "idle" })

	async function compose() {
		if (!isValidStellarAddress(target)) {
			setAddressError("Enter a valid Stellar address (G... or C...)")
			return
		}
		setAddressError(null)
		try {
			setStatus({
				state: "pending",
				msg: "Building and simulating the transaction",
			})
			const xdr = await buildAdminTx(op, target)
			// Drop the composer straight into the sign round so they add the
			// first signature instead of hand-carrying a link to themselves.
			void navigate(`/admin${encodeAdminLink(xdr).hash}`)
		} catch (e) {
			setStatus({
				state: "error",
				msg: e instanceof Error ? e.message : "Could not build the transaction",
			})
		}
	}

	return (
		<>
			<div className="panel-h">
				<ShieldCheck size={18} /> Compose operation
			</div>

			<div className="seg">
				<button
					className={op === "allow" ? "is-active" : ""}
					onClick={() => setOp("allow")}
				>
					Allow
				</button>
				<button
					className={op === "disallow" ? "is-active" : ""}
					onClick={() => setOp("disallow")}
				>
					Disallow
				</button>
			</div>

			<label className="field-k" htmlFor="target">
				Target address
			</label>
			<div className="inp">
				<input
					id="target"
					placeholder="G... or C..."
					value={target}
					onChange={(e) => {
						setTarget(e.target.value.trim())
						setAddressError(null)
					}}
				/>
			</div>
			{addressError && (
				<div className="status status--error">{addressError}</div>
			)}

			<button
				className="btn"
				disabled={!target || status.state === "pending"}
				onClick={compose}
			>
				{status.state === "pending" && (
					<CircleNotch size={17} className="spin" />
				)}
				{status.state === "pending" ? "Building…" : "Build & start signing"}
			</button>

			{status.state === "error" && (
				<div className="status status--error">{status.msg}</div>
			)}
		</>
	)
}

/**
 * Decodes and parses the incoming `#tx=` link once per hash change. Keeping
 * this out of `SignView` keeps that component's branching focused on
 * rendering, not on link parsing.
 */
function useDecodedAdminTx(hash: string) {
	const [xdr, setXdr] = useState<string | null>(null)
	const [summary, setSummary] = useState<AdminTxSummary | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		try {
			const decoded = decodeAdminLink(hash)
			const parsedSummary = describeAdminTx(decoded.xdr)
			setXdr(decoded.xdr)
			setSummary(parsedSummary)
			setError(null)
		} catch (e) {
			setXdr(null)
			setSummary(null)
			setError(e instanceof Error ? e.message : "Invalid admin link")
		}
	}, [hash])

	return { xdr, summary, error, setXdr, setSummary }
}

function SignView({ hash }: { hash: string }) {
	const navigate = useNavigate()
	const {
		address,
		networkPassphrase: walletNetworkPassphrase,
		signTransaction,
	} = useWallet()
	const signersQuery = useAccountSigners()
	const { xdr, summary, error, setXdr, setSummary } = useDecodedAdminTx(hash)
	const [status, setStatus] = useState<Status>({ state: "idle" })
	const [submittedHash, setSubmittedHash] = useState<string | null>(null)

	const collected = useMemo(() => {
		if (!xdr || !signersQuery.data) return null
		const tx = StellarSdk.TransactionBuilder.fromXDR(
			xdr,
			networkPassphrase,
		) as StellarSdk.Transaction
		return computeCollected(
			tx,
			signersQuery.data.signers,
			signersQuery.data.medThreshold,
		)
	}, [xdr, signersQuery.data])

	if (error) {
		return <div className="status status--error">Invalid link: {error}</div>
	}
	if (!summary || !xdr) {
		return <p className="muted">Reading transaction…</p>
	}

	if (submittedHash) {
		const net =
			networkPassphrase === StellarSdk.Networks.PUBLIC ? "public" : "testnet"
		return (
			<>
				<div className="panel-h">
					<SealCheck size={18} /> Submitted
				</div>
				<div className="status status--success">
					Operation confirmed on-chain — the allowlist was updated.
				</div>
				<div className="pos-rows">
					<div className="pos-row">
						<span className="k">Operation</span>
						<span className="mono">{summary.op}</span>
					</div>
					<div className="pos-row">
						<span className="k">Target</span>
						<span className="mono">{summary.target}</span>
					</div>
					<div className="pos-row">
						<span className="k">Transaction</span>
						<span className="mono">
							{submittedHash.slice(0, 8)}…{submittedHash.slice(-8)}
						</span>
					</div>
				</div>
				<a
					className="btn"
					href={`https://stellar.expert/explorer/${net}/tx/${submittedHash}`}
					target="_blank"
					rel="noreferrer"
				>
					View on explorer
				</a>
				<button className="btn" onClick={() => navigate("/admin")}>
					Compose another
				</button>
			</>
		)
	}

	const expired = summary.maxTime > 0 && summary.maxTime * 1000 < Date.now()
	if (expired) {
		return (
			<>
				<div className="status status--error">This link has expired.</div>
				<button className="btn" onClick={() => navigate("/admin")}>
					Recompose
				</button>
			</>
		)
	}

	const networkMismatch =
		Boolean(walletNetworkPassphrase) &&
		walletNetworkPassphrase !== networkPassphrase
	const met = collected?.met ?? false

	async function sign() {
		if (!address) return
		try {
			setStatus({
				state: "pending",
				msg: "Confirm the signature in your wallet",
			})
			const { signedTxXdr } = await signTransaction(xdr as string, {
				networkPassphrase,
				address,
			})
			const merged = mergeSignatures(
				xdr as string,
				signedTxXdr,
				networkPassphrase,
			)
			setXdr(merged)
			setSummary(describeAdminTx(merged))
			void navigate(`/admin${encodeAdminLink(merged).hash}`, { replace: true })
			setStatus({
				state: "success",
				msg: "Signature added — share the updated link with the next signer",
			})
		} catch (e) {
			setStatus({
				state: "error",
				msg: e instanceof Error ? e.message : "Could not sign",
			})
		}
	}

	async function submit() {
		try {
			setStatus({
				state: "pending",
				msg: "Submitting and waiting for on-chain confirmation…",
			})
			const hash = await submitAdminTx(xdr as string)
			setSubmittedHash(hash)
			setStatus({ state: "success", msg: "Confirmed — allowlist updated" })
		} catch (e) {
			setStatus({
				state: "error",
				msg: e instanceof Error ? e.message : "Submit failed",
			})
		}
	}

	return (
		<>
			<div className="panel-h">
				<SealCheck size={18} /> Sign round
			</div>

			<div className="pos-rows">
				<div className="pos-row">
					<span className="k">Operation</span>
					<span className="mono">{summary.op}</span>
				</div>
				<div className="pos-row">
					<span className="k">Target</span>
					<span className="mono">{summary.target}</span>
				</div>
				<div className="pos-row">
					<span className="k">Source (gov)</span>
					<span className="mono">{summary.source}</span>
				</div>
				<div className="pos-row">
					<span className="k">Collected weight</span>
					<span className="mono">
						{collected ? collected.weight : "…"} /{" "}
						{signersQuery.data?.medThreshold ?? "…"}
					</span>
				</div>
			</div>

			{networkMismatch && (
				<div className="status status--error">
					Your wallet is on a different network than this transaction. Switch
					networks to continue.
				</div>
			)}
			{!address && <p className="muted">Connect a wallet to sign.</p>}

			<button
				className="btn"
				disabled={!address || networkMismatch || status.state === "pending"}
				onClick={sign}
			>
				{status.state === "pending" && (
					<CircleNotch size={17} className="spin" />
				)}
				Sign
			</button>

			<button
				className="btn"
				disabled={!met || status.state === "pending"}
				onClick={submit}
			>
				Submit
				{met
					? ""
					: ` (needs ${signersQuery.data?.medThreshold ?? "?"} signatures)`}
			</button>

			{status.state === "success" && (
				<div className="status status--success">{status.msg}</div>
			)}
			{status.state === "error" && (
				<div className="status status--error">{status.msg}</div>
			)}

			<div className="mono" style={{ wordBreak: "break-all", marginTop: 14 }}>
				{adminLinkFor(xdr)}
			</div>
		</>
	)
}
