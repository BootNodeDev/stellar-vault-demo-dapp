// Horizon rejects a bad submission with a 400 whose axios error message is the
// opaque "Request failed with status code 400". The actionable detail lives in
// `extras.result_codes` (e.g. op_low_reserve, op_no_trust). Surface those.

interface HorizonResultCodes {
	transaction?: string
	operations?: string[]
}

function horizonResultCodes(e: unknown): HorizonResultCodes | undefined {
	return (
		e as {
			response?: { data?: { extras?: { result_codes?: HorizonResultCodes } } }
		}
	)?.response?.data?.extras?.result_codes
}

/**
 * Turns a submission error into a human-readable message. Prefers Horizon's
 * `result_codes` (transaction + per-operation codes) when present, otherwise
 * falls back to the error's own message.
 */
export function formatTxError(
	e: unknown,
	fallback = "Something went wrong",
): string {
	const codes = horizonResultCodes(e)
	if (codes) {
		const parts = [
			...(codes.transaction ? [codes.transaction] : []),
			...(codes.operations ?? []),
		]
		if (parts.length > 0) return parts.join(", ")
	}
	return e instanceof Error ? e.message : fallback
}
