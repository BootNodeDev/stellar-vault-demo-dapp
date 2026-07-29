import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useWallet } from "@/hooks/useWallet"
import { vault } from "@/lib/vaultClient"

// Contract reads resolve via simulation: `.result` already comes populated
// without sending a transaction (free, no signature).
async function read<T>(call: Promise<{ result: T }>): Promise<T> {
	return (await call).result
}

export interface VaultState {
	totalAssets: bigint // TVL, in stroops
	totalSupply: bigint // shares in circulation
	symbol: string
	shares: bigint // the user's shares
	positionValue: bigint // the user's position value, in the underlying asset
	sharePrice: number
	lpCount: number // number of LPs with a position (holders with shares > 0)
}

export function useVault() {
	const { address } = useWallet()

	return useQuery<VaultState>({
		queryKey: ["vault", address ?? "anon"],
		refetchInterval: 8000,
		refetchIntervalInBackground: false,
		// Keep the last good data during refetch / transient RPC errors so the
		// dashboard doesn't flash to empty when a read hiccups (the public testnet
		// RPC throttles under load).
		placeholderData: keepPreviousData,
		retry: 2,
		queryFn: async () => {
			const [totalAssets, totalSupply, symbol, lpCount] = await Promise.all([
				read<bigint>(vault.total_assets()),
				read<bigint>(vault.total_supply()),
				read<string>(vault.symbol()),
				read<number>(vault.lp_count()),
			])

			let shares = 0n
			let positionValue = 0n
			if (address) {
				shares = await read<bigint>(vault.balance({ account: address }))
				if (shares > 0n) {
					positionValue = await read<bigint>(
						vault.convert_to_assets({ shares }),
					)
				}
			}

			const sharePrice =
				totalSupply > 0n ? Number(totalAssets) / Number(totalSupply) : 1

			return {
				totalAssets,
				totalSupply,
				symbol,
				shares,
				positionValue,
				sharePrice,
				lpCount,
			}
		},
	})
}

// Allowlist status is its own small, resilient query keyed by the connected
// address, so a hiccup in the heavier vault reads never hides the deposit form.
export function useIsAllowed() {
	const { address } = useWallet()

	return useQuery<boolean>({
		queryKey: ["is-allowed", address ?? "anon"],
		enabled: !!address,
		refetchInterval: 8000,
		refetchIntervalInBackground: false,
		retry: 2,
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!address) return false
			return read<boolean>(vault.is_allowed({ account: address }))
		},
	})
}
