// USDC and the vault's shares both use 7 decimals (stroops).
export const DECIMALS = 7
const SCALE = 10n ** BigInt(DECIMALS)

/** Parses a decimal string ("12.5") into i128 stroops (bigint), without floats. */
export function parseAmount(input: string): bigint {
	const trimmed = input.trim()
	if (!trimmed) return 0n
	const [whole, frac = ""] = trimmed.replace(/,/g, "").split(".")
	const fracPadded = (frac + "0".repeat(DECIMALS)).slice(0, DECIMALS)
	return BigInt(whole || "0") * SCALE + BigInt(fracPadded || "0")
}

/** Formats an i128 (stroops) into a readable string with a thousands separator. */
export function formatAmount(raw: bigint, displayDecimals = 2): string {
	const whole = raw / SCALE
	const frac = raw % SCALE
	const fracStr = frac
		.toString()
		.padStart(DECIMALS, "0")
		.slice(0, displayDecimals)
	const wholeStr = whole.toLocaleString("en-US")
	return displayDecimals > 0 ? `${wholeStr}.${fracStr}` : wholeStr
}

/** i128 (stroops) → number in whole units, for animations/derived values. */
export function toUnits(raw: bigint): number {
	return Number(raw) / Number(SCALE)
}
