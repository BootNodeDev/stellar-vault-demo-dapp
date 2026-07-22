import { horizonUrl, networkPassphrase } from "@stellar-scaffold/app-lib"
import { vault } from "@stellar-scaffold/app-lib/clients"
import {
	ArrowLineDown,
	ArrowLineUp,
	ArrowUpRight,
	CircleNotch,
	SealCheck,
	Wallet,
} from "@phosphor-icons/react"
import * as StellarSdk from "@stellar/stellar-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useVault } from "../../hooks/useVault"
import { useWallet } from "../../hooks/useWallet"
import { parseAmount, toUnits } from "../../lib/format"
import { AnimatedNumber } from "../AnimatedNumber"

const FAUCET = "https://faucet.circle.com"
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
const USDC_KEY = `USDC:${USDC_ISSUER}`

export default function VaultDashboard() {
	const { data, isLoading } = useVault()
	const { address } = useWallet()

	const tvl = data ? toUnits(data.totalAssets) : 0
	const supply = data ? toUnits(data.totalSupply) : 0
	const sharePrice = data?.sharePrice ?? 1
	const position = data ? toUnits(data.positionValue) : 0
	const shares = data ? toUnits(data.shares) : 0

	return (
		<div>
			<header className="vhead">
				<h1>Ballast Reinsurance Vault</h1>
				<p>
					Deposit USDC and receive bvUSDC shares tracking the vault&apos;s net asset
					value. Redeemable on-chain, any time.
				</p>
			</header>

			<section className="stats">
				<Stat k="Total value locked" loading={isLoading}>
					<AnimatedNumber value={tvl} prefix="$" />
				</Stat>
				<Stat k="Share price" unit="USDC / bvUSDC" loading={isLoading}>
					<AnimatedNumber value={sharePrice} decimals={4} />
				</Stat>
				<Stat k="Shares outstanding" unit="bvUSDC" loading={isLoading}>
					<AnimatedNumber value={supply} />
				</Stat>
				<Stat k="Your position" unit={address ? "USDC" : undefined} loading={isLoading}>
					{address ? <AnimatedNumber value={position} prefix="$" /> : <span className="mono">—</span>}
				</Stat>
			</section>

			<div className="cols">
				<section className="panel">
					<div className="panel-h">
						<Wallet size={18} /> Your position
					</div>
					{!address ? (
						<p className="muted">Connect a wallet to view your position and deposit.</p>
					) : shares > 0 ? (
						<>
							<div className="pos-v mono">
								${position.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</div>
							<div className="pos-rows">
								<PosRow k="Shares held" v={`${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} bvUSDC`} />
								<PosRow
									k="Share of vault"
									v={supply > 0 ? `${((shares / supply) * 100).toFixed(2)}%` : "0%"}
								/>
								<PosRow k="Entry price" v={`${sharePrice.toFixed(4)} USDC`} />
							</div>
						</>
					) : (
						<p className="muted">
							No shares yet. Deposit USDC on the right to mint your first bvUSDC and start
							tracking the vault&apos;s NAV.
						</p>
					)}
				</section>

				<section className="panel">
					<ActionPanel />
				</section>
			</div>
		</div>
	)
}

function Stat({
	k,
	unit,
	loading,
	children,
}: {
	k: string
	unit?: string
	loading?: boolean
	children: React.ReactNode
}) {
	return (
		<div className="stat">
			<div className="stat-k">{k}</div>
			<div className="stat-v">{loading ? <span className="skel w2" /> : children}</div>
			{unit && <div className="stat-u">{unit}</div>}
		</div>
	)
}

function PosRow({ k, v }: { k: string; v: string }) {
	return (
		<div className="pos-row">
			<span className="k">{k}</span>
			<span className="mono">{v}</span>
		</div>
	)
}

type Status = { state: "idle" | "pending" | "success" | "error"; msg?: string }

function ActionPanel() {
	const { address, balances, signTransaction, updateBalances } = useWallet()
	const { data } = useVault()
	const qc = useQueryClient()

	const [tab, setTab] = useState<"deposit" | "withdraw">("deposit")
	const [amount, setAmount] = useState("")
	const [status, setStatus] = useState<Status>({ state: "idle" })

	const usdcLine = balances?.[USDC_KEY]
	const hasTrust = !!usdcLine
	const usdcBal = usdcLine ? Number(String(usdcLine.balance).replace(/,/g, "")) : 0
	const shareBal = data ? toUnits(data.shares) : 0

	const sharePrice = data?.sharePrice || 1
	const parsed = parseAmount(amount || "0")
	const n = Number(amount || 0)
	const estimate = tab === "deposit" ? n / (sharePrice || 1) : n * (sharePrice || 1)
	const available = tab === "deposit" ? usdcBal : shareBal
	const disabled = !address || parsed <= 0n || status.state === "pending"

	async function enableUsdc() {
		if (!address) return
		try {
			setStatus({ state: "pending", msg: "Confirm the USDC trustline in your wallet" })
			const server = new StellarSdk.Horizon.Server(horizonUrl)
			const account = await server.loadAccount(address)
			const tx = new StellarSdk.TransactionBuilder(account, {
				fee: StellarSdk.BASE_FEE,
				networkPassphrase,
			})
				.addOperation(
					StellarSdk.Operation.changeTrust({
						asset: new StellarSdk.Asset("USDC", USDC_ISSUER),
					}),
				)
				.setTimeout(180)
				.build()
			const { signedTxXdr } = await signTransaction(tx.toXDR(), { networkPassphrase, address })
			await server.submitTransaction(
				StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase) as StellarSdk.Transaction,
			)
			setStatus({ state: "success", msg: "USDC enabled — mint from the faucet, then deposit" })
			await updateBalances()
		} catch (e) {
			setStatus({ state: "error", msg: e instanceof Error ? e.message : "Could not enable USDC" })
		}
	}

	async function submit() {
		if (!address) return
		try {
			setStatus({
				state: "pending",
				msg: tab === "deposit" ? "Confirm the deposit in your wallet" : "Confirm the withdrawal in your wallet",
			})
			const args =
				tab === "deposit"
					? { assets: parsed, receiver: address, from: address, operator: address }
					: { assets: parsed, receiver: address, owner: address, operator: address }
			const tx =
				tab === "deposit"
					? await vault.deposit(args as never, { publicKey: address })
					: await vault.withdraw(args as never, { publicKey: address })
			const sent = await tx.signAndSend({ signTransaction })
			if ((sent as { result?: { isErr?: () => boolean } }).result?.isErr?.()) {
				throw new Error("Transaction reverted on-chain")
			}
			setStatus({
				state: "success",
				msg: tab === "deposit" ? "Deposit confirmed — shares minted" : "Withdrawal confirmed — USDC returned",
			})
			setAmount("")
			await Promise.all([qc.invalidateQueries({ queryKey: ["vault"] }), updateBalances()])
		} catch (e) {
			setStatus({ state: "error", msg: e instanceof Error ? e.message : "Something went wrong" })
		}
	}

	// Not connected
	if (!address) {
		return (
			<>
				<button className="btn" disabled>
					Connect wallet to continue
				</button>
				<FaucetLink />
			</>
		)
	}

	// Connected but no USDC trustline — the on-chain opt-in must happen first.
	if (!hasTrust) {
		return (
			<>
				<div className="panel-h">
					<SealCheck size={18} /> Enable USDC
				</div>
				<p className="muted">
					Your wallet hasn&apos;t opted into USDC yet. Establish the trustline once (a
					standard Stellar opt-in), then mint test USDC and deposit.
				</p>
				<button className="btn" onClick={enableUsdc} disabled={status.state === "pending"}>
					{status.state === "pending" && <CircleNotch size={17} className="spin" />}
					{status.state === "pending" ? "Awaiting signature" : "Enable USDC"}
				</button>
				{status.state === "success" && <div className="status status--success">{status.msg}</div>}
				{status.state === "error" && <div className="status status--error">{status.msg}</div>}
				<FaucetLink />
			</>
		)
	}

	// Connected with trustline — deposit / withdraw
	return (
		<>
			<div className="seg">
				<button
					className={tab === "deposit" ? "is-active" : ""}
					onClick={() => {
						setTab("deposit")
						setStatus({ state: "idle" })
					}}
				>
					<ArrowLineDown size={16} /> Deposit
				</button>
				<button
					className={tab === "withdraw" ? "is-active" : ""}
					onClick={() => {
						setTab("withdraw")
						setStatus({ state: "idle" })
					}}
				>
					<ArrowLineUp size={16} /> Withdraw
				</button>
			</div>

			<label className="field-k" htmlFor="amt">
				{tab === "deposit" ? "Amount to deposit" : "Amount to withdraw"}
			</label>
			<div className="inp">
				<input
					id="amt"
					inputMode="decimal"
					placeholder="0.00"
					value={amount}
					onChange={(e) => {
						setAmount(e.target.value.replace(/[^0-9.]/g, ""))
						setStatus({ state: "idle" })
					}}
				/>
				<span className="u">{tab === "deposit" ? "USDC" : "bvUSDC"}</span>
			</div>

			<div className="est">
				<span>
					Available {available.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
					{tab === "deposit" ? "USDC" : "bvUSDC"}
				</span>
				{parsed > 0n && (
					<span>
						{" · you receive "}
						<b>
							{estimate.toLocaleString("en-US", { maximumFractionDigits: 4 })}{" "}
							{tab === "deposit" ? "bvUSDC" : "USDC"}
						</b>
					</span>
				)}
			</div>

			<button className="btn" disabled={disabled} onClick={submit}>
				{status.state === "pending" && <CircleNotch size={17} className="spin" />}
				{status.state === "pending"
					? "Awaiting signature"
					: tab === "deposit"
						? "Deposit USDC"
						: "Withdraw USDC"}
			</button>

			{status.state === "success" && <div className="status status--success">{status.msg}</div>}
			{status.state === "error" && <div className="status status--error">{status.msg}</div>}

			<FaucetLink />
		</>
	)
}

function FaucetLink() {
	return (
		<a className="faucet" href={FAUCET} target="_blank" rel="noreferrer">
			Need test USDC? Mint from Circle&apos;s faucet — pick Stellar <ArrowUpRight size={14} />
		</a>
	)
}
