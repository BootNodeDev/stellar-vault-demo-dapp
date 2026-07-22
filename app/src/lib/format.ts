// USDC y las shares del vault usan 7 decimales (stroops).
export const DECIMALS = 7
const SCALE = 10n ** BigInt(DECIMALS)

/** Parsea un string decimal ("12.5") a i128 en stroops (bigint), sin float. */
export function parseAmount(input: string): bigint {
	const trimmed = input.trim()
	if (!trimmed) return 0n
	const [whole, frac = ""] = trimmed.replace(/,/g, "").split(".")
	const fracPadded = (frac + "0".repeat(DECIMALS)).slice(0, DECIMALS)
	return BigInt(whole || "0") * SCALE + BigInt(fracPadded || "0")
}

/** Formatea un i128 (stroops) a string legible con separador de miles. */
export function formatAmount(raw: bigint, displayDecimals = 2): string {
	const whole = raw / SCALE
	const frac = raw % SCALE
	const fracStr = frac.toString().padStart(DECIMALS, "0").slice(0, displayDecimals)
	const wholeStr = whole.toLocaleString("en-US")
	return displayDecimals > 0 ? `${wholeStr}.${fracStr}` : wholeStr
}

/** i128 (stroops) → number en unidades, para animaciones/derivados. */
export function toUnits(raw: bigint): number {
	return Number(raw) / Number(SCALE)
}
