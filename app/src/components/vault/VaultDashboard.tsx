import {
	ArrowLineDown,
	ArrowLineUp,
	ArrowUpRight,
	CircleNotch,
	SealCheck,
	Wallet,
} from "@phosphor-icons/react"
import * as StellarSdk from "@stellar/stellar-sdk"
import { horizonUrl, networkPassphrase } from "@stellar-scaffold/app-lib"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { useIsAllowed, useVault } from "@/hooks/useVault"
import { useWallet } from "@/hooks/useWallet"
import { formatTxError } from "@/lib/errors"
import { parseAmount, toUnits } from "@/lib/format"
import { vault } from "@/lib/vaultClient"

const FAUCET = "https://faucet.circle.com"
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
const USDC_KEY = `USDC:${USDC_ISSUER}`

export default function VaultDashboard() {
	const { data } = useVault()
	const { address } = useWallet()
	// Skeleton only on the very first load (no data yet), never on background
	// refetches — otherwise the dashboard flashes the skeleton on every poll.
	const isLoading = !data

	const tvl = data ? toUnits(data.totalAssets) : 0
	const supply = data ? toUnits(data.totalSupply) : 0
	const sharePrice = data?.sharePrice ?? 1
	const position = data ? toUnits(data.positionValue) : 0
	const shares = data ? toUnits(data.shares) : 0
	const lpCount = data?.lpCount ?? 0

	return (
		<div>
			<header className="vhead">
				<h1>Reinsurance Vault</h1>
				<p>
					Deposit USDC and receive bvUSDC shares tracking the vault&apos;s net
					asset value. Redeemable on-chain, any time.
				</p>
			</header>

			<section className="stats">
				<Stat k="Total value locked" loading={isLoading}>
					<AnimatedNumber value={tvl} prefix="$" />
				</Stat>
				<Stat k="Liquidity providers" loading={isLoading}>
					<AnimatedNumber value={lpCount} decimals={0} />
				</Stat>
				<Stat k="Share price" unit="USDC / bvUSDC" loading={isLoading}>
					<AnimatedNumber value={sharePrice} decimals={4} />
				</Stat>
				<Stat k="Shares outstanding" unit="bvUSDC" loading={isLoading}>
					<AnimatedNumber value={supply} />
				</Stat>
				<Stat
					k="Your position"
					unit={address ? "USDC" : undefined}
					loading={isLoading}
				>
					{address ? (
						<AnimatedNumber value={position} prefix="$" />
					) : (
						<span className="mono">—</span>
					)}
				</Stat>
			</section>

			<div className="cols">
				<section className="panel">
					<div className="panel-h">
						<Wallet size={18} /> Your position
					</div>
					{!address ? (
						<p className="muted">
							Connect a wallet to view your position and deposit.
						</p>
					) : shares > 0 ? (
						<>
							<div className="pos-v mono">
								$
								{position.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</div>
							<div className="pos-rows">
								<PosRow
									k="Shares held"
									v={`${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} bvUSDC`}
								/>
								<PosRow
									k="Share of vault"
									v={
										supply > 0
											? `${((shares / supply) * 100).toFixed(2)}%`
											: "0%"
									}
								/>
								<PosRow k="Entry price" v={`${sharePrice.toFixed(4)} USDC`} />
							</div>
						</>
					) : (
						<p className="muted">
							No shares yet. Deposit USDC on the right to mint your first bvUSDC
							and start tracking the vault&apos;s NAV.
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
			<div className="stat-v">
				{loading ? <span className="skel w2" /> : children}
			</div>
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
	const {
		address,
		balances,
		networkPassphrase: walletNetworkPassphrase,
		signTransaction,
		updateBalances,
	} = useWallet()
	const { data } = useVault()
	const { data: allowed } = useIsAllowed()
	const qc = useQueryClient()

	const [tab, setTab] = useState<"deposit" | "withdraw">("deposit")
	const [amount, setAmount] = useState("")
	const [status, setStatus] = useState<Status>({ state: "idle" })
	const [txHash, setTxHash] = useState<string | null>(null)

	const usdcLine = balances?.[USDC_KEY]
	const hasTrust = !!usdcLine
	const usdcBal = usdcLine
		? Number(String(usdcLine.balance).replace(/,/g, ""))
		: 0
	const shareBal = data ? toUnits(data.shares) : 0

	const sharePrice = data?.sharePrice || 1
	const parsed = parseAmount(amount || "0")
	const n = Number(amount || 0)
	const estimate =
		tab === "deposit" ? n / (sharePrice || 1) : n * (sharePrice || 1)
	const available = tab === "deposit" ? usdcBal : shareBal
	const isAllowed = allowed ?? false
	const kycBlocked = tab === "deposit" && !isAllowed
	const networkMismatch =
		Boolean(walletNetworkPassphrase) &&
		walletNetworkPassphrase !== networkPassphrase
	const disabled =
		!address || parsed <= 0n || status.state === "pending" || networkMismatch

	async function enableUsdc() {
		if (!address || networkMismatch) return
		try {
			setStatus({
				state: "pending",
				msg: "Confirm the USDC trustline in your wallet",
			})
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
			const { signedTxXdr } = await signTransaction(tx.toXDR(), {
				networkPassphrase,
				address,
			})
			await server.submitTransaction(
				StellarSdk.TransactionBuilder.fromXDR(
					signedTxXdr,
					networkPassphrase,
				) as StellarSdk.Transaction,
			)
			setStatus({
				state: "success",
				msg: "USDC enabled — mint from the faucet, then deposit",
			})
			await updateBalances()
		} catch (e) {
			setStatus({
				state: "error",
				msg: formatTxError(e, "Could not enable USDC"),
			})
		}
	}

	async function submit() {
		if (!address || networkMismatch) return
		try {
			setStatus({
				state: "pending",
				msg:
					tab === "deposit"
						? "Confirm the deposit in your wallet"
						: "Confirm the withdrawal in your wallet",
			})
			const tx =
				tab === "deposit"
					? await vault.deposit(
							{ assets: parsed, receiver: address, from: address, operator: address },
							{ publicKey: address },
						)
					: await vault.withdraw(
							{ assets: parsed, receiver: address, owner: address, operator: address },
							{ publicKey: address },
						)
			const sent = await tx.signAndSend({ signTransaction })
			// `.result` throws if the on-chain call reverted (a FAILED transaction
			// has no return value) — signAndSend itself only throws for
			// submission-level failures, so this access is what surfaces a revert.
			void sent.result
			setTxHash(
				sent.sendTransactionResponse?.hash ??
					sent.getTransactionResponse?.txHash ??
					null,
			)
			setStatus({
				state: "success",
				msg:
					tab === "deposit"
						? "Deposit confirmed — shares minted"
						: "Withdrawal confirmed — USDC returned",
			})
			setAmount("")
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["vault"] }),
				updateBalances(),
			])
		} catch (e) {
			setStatus({ state: "error", msg: formatTxError(e) })
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
					Your wallet hasn&apos;t opted into USDC yet. Establish the trustline
					once (a standard Stellar opt-in), then mint test USDC and deposit.
				</p>
				{networkMismatch && <NetworkMismatchBanner />}
				<button
					className="btn"
					onClick={enableUsdc}
					disabled={status.state === "pending" || networkMismatch}
				>
					{status.state === "pending" && (
						<CircleNotch size={17} className="spin" />
					)}
					{status.state === "pending" ? "Awaiting signature" : "Enable USDC"}
				</button>
				{status.state === "success" && (
					<div className="status status--success">{status.msg}</div>
				)}
				{status.state === "error" && (
					<div className="status status--error">{status.msg}</div>
				)}
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
						setTxHash(null)
					}}
				>
					<ArrowLineDown size={16} /> Deposit
				</button>
				<button
					className={tab === "withdraw" ? "is-active" : ""}
					onClick={() => {
						setTab("withdraw")
						setStatus({ state: "idle" })
						setTxHash(null)
					}}
				>
					<ArrowLineUp size={16} /> Withdraw
				</button>
			</div>

			{networkMismatch && <NetworkMismatchBanner />}

			{kycBlocked ? (
				<>
					<div className="status status--error" style={{ marginTop: 12 }}>
						This wallet isn&apos;t approved to deposit. Deposits are gated by
						the vault&apos;s KYC allowlist — ask the compliance admin to allow
						your address. (You can still withdraw an existing position.)
					</div>
					<div className="pos-row" style={{ marginTop: 10 }}>
						<span className="k">Your address</span>
						<span className="mono">{address}</span>
					</div>
				</>
			) : (
				<>
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
								setTxHash(null)
							}}
						/>
						<span className="u">{tab === "deposit" ? "USDC" : "bvUSDC"}</span>
					</div>

					<div className="est">
						<span>
							Available{" "}
							{available.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
							{tab === "deposit" ? "USDC" : "bvUSDC"}
						</span>
						{parsed > 0n && (
							<span>
								{" · you receive "}
								<b>
									{estimate.toLocaleString("en-US", {
										maximumFractionDigits: 4,
									})}{" "}
									{tab === "deposit" ? "bvUSDC" : "USDC"}
								</b>
							</span>
						)}
					</div>

					<button className="btn" disabled={disabled} onClick={submit}>
						{status.state === "pending" && (
							<CircleNotch size={17} className="spin" />
						)}
						{status.state === "pending"
							? "Awaiting signature"
							: tab === "deposit"
								? "Deposit USDC"
								: "Withdraw USDC"}
					</button>

					{status.state === "success" && (
						<div className="status status--success">{status.msg}</div>
					)}
					{status.state === "success" && txHash && (
						<TxExplorerLink hash={txHash} />
					)}
					{status.state === "error" && (
						<div className="status status--error">{status.msg}</div>
					)}
				</>
			)}

			<FaucetLink />
		</>
	)
}

function FaucetLink() {
	return (
		<a className="faucet" href={FAUCET} target="_blank" rel="noreferrer">
			Need test USDC? Mint from Circle&apos;s faucet — pick Stellar{" "}
			<ArrowUpRight size={14} />
		</a>
	)
}

function NetworkMismatchBanner() {
	return (
		<div className="status status--error">
			Your wallet is on a different network than this app. Switch networks to
			continue.
		</div>
	)
}

function TxExplorerLink({ hash }: { hash: string }) {
	const net =
		networkPassphrase === StellarSdk.Networks.PUBLIC ? "public" : "testnet"
	return (
		<a
			className="btn"
			href={`https://stellar.expert/explorer/${net}/tx/${hash}`}
			target="_blank"
			rel="noreferrer"
		>
			View on explorer
		</a>
	)
}
