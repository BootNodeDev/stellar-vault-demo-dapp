import { vault } from "@stellar-scaffold/app-lib/clients"
import { useQuery } from "@tanstack/react-query"
import { useWallet } from "./useWallet"

// Las lecturas del contrato se resuelven por simulación: el `.result` ya viene
// poblado sin enviar transacción (gratis, sin firma).
async function read<T>(call: Promise<{ result: T }>): Promise<T> {
	return (await call).result
}

export interface VaultState {
	totalAssets: bigint // TVL, en stroops
	totalSupply: bigint // shares en circulación
	symbol: string
	shares: bigint // shares del usuario
	positionValue: bigint // valor de la posición del usuario, en el subyacente
	sharePrice: number
	isAllowed: boolean // si el usuario conectado está en el allowlist (KYC)
	lpCount: number // cantidad de LPs con posición (holders con shares > 0)
}

export function useVault() {
	const { address } = useWallet()

	return useQuery<VaultState>({
		queryKey: ["vault", address ?? "anon"],
		refetchInterval: 8000,
		queryFn: async () => {
			const [totalAssets, totalSupply, symbol, lpCount] = await Promise.all([
				read<bigint>(vault.total_assets()),
				read<bigint>(vault.total_supply()),
				read<string>(vault.symbol()),
				read<number>(vault.lp_count()),
			])

			let shares = 0n
			let positionValue = 0n
			let isAllowed = false
			if (address) {
				isAllowed = await read<boolean>(vault.is_allowed({ account: address }))
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
				isAllowed,
				lpCount,
			}
		},
	})
}
