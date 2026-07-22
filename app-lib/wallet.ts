import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import { Horizon } from "@stellar/stellar-sdk"
import { networkPassphrase, stellarNetwork } from "./env"
import storage from "./storage"

StellarWalletsKit.init({
	network: networkPassphrase,
	modules: defaultModules(),
})

export const connectWallet = async () => {
	// `authModal` opens the wallet picker, sets the chosen wallet as the active
	// module and returns its address in one step (replaces v1's `openModal` +
	// `onWalletSelected` callback).
	const { address } = await StellarWalletsKit.authModal()
	const selectedId = StellarWalletsKit.selectedModule.productId

	if (address) {
		storage.setItem("walletId", selectedId)
		storage.setItem("walletAddress", address)
	} else {
		storage.setItem("walletId", "")
		storage.setItem("walletAddress", "")
	}

	if (selectedId === "freighter" || selectedId === "hot-wallet") {
		const network = await StellarWalletsKit.getNetwork()
		if (network.network && network.networkPassphrase) {
			storage.setItem("walletNetwork", network.network)
			storage.setItem("networkPassphrase", network.networkPassphrase)
		} else {
			storage.setItem("walletNetwork", "")
			storage.setItem("networkPassphrase", "")
		}
	}
}

export const disconnectWallet = async () => {
	await StellarWalletsKit.disconnect()
	storage.removeItem("walletId")
	storage.removeItem("walletAddress")
	storage.removeItem("walletNetwork")
	storage.removeItem("networkPassphrase")
}

function getHorizonHost(mode: string) {
	switch (mode) {
		case "LOCAL":
			return "http://localhost:8000"
		case "FUTURENET":
			return "https://horizon-futurenet.stellar.org"
		case "TESTNET":
			return "https://horizon-testnet.stellar.org"
		case "PUBLIC":
			return "https://horizon.stellar.org"
		default:
			throw new Error(`Unknown Stellar network: ${mode}`)
	}
}

const horizon = new Horizon.Server(getHorizonHost(stellarNetwork), {
	allowHttp: stellarNetwork === "LOCAL",
})

const formatter = new Intl.NumberFormat()

export type MappedBalances = Record<string, Horizon.HorizonApi.BalanceLine>

export const fetchBalances = async (address: string) => {
	try {
		const { balances } = await horizon.accounts().accountId(address).call()
		const mapped = balances.reduce((acc, b) => {
			b.balance = formatter.format(Number(b.balance))
			const key =
				b.asset_type === "native"
					? "xlm"
					: b.asset_type === "liquidity_pool_shares"
						? b.liquidity_pool_id
						: `${b.asset_code}:${b.asset_issuer}`
			acc[key] = b
			return acc
		}, {} as MappedBalances)
		return mapped
	} catch (err) {
		// `not found` is sort of expected, indicating an unfunded wallet, which
		// the consumer of `balances` can understand via the lack of `xlm` key.
		// If the error does NOT match 'not found', log the error.
		// We should also possibly not return `{}` in this case?
		if (!(err instanceof Error && err.message.match(/not found/i))) {
			console.error(err)
		}
		return {}
	}
}

export const wallet = StellarWalletsKit
