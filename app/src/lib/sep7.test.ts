import { describe, expect, it } from "vitest"
import { decodeAdminLink, encodeAdminLink } from "./sep7"

const SAMPLE_XDR =
	"AAAAAgAAAAAvzHl1JiP4hyx1TjLo7/pLGVCM9BWH8yUj9GwzSU3EbwAAAGQAAAAAAAAAAQAAAAEAAAAA"

describe("encodeAdminLink / decodeAdminLink round trip", () => {
	it("decodes back the exact xdr that was encoded", () => {
		const { hash } = encodeAdminLink(SAMPLE_XDR)
		const decoded = decodeAdminLink(hash)
		expect(decoded.xdr).toBe(SAMPLE_XDR)
	})

	it("round-trips a different xdr payload to prove no hardcoding", () => {
		const otherXdr =
			"AAAAAgAAAAA3JVXvHwbz2AaJswjNn6XLdyGqR8x/pO/AhSU0nR8m0AAAAGQAAAAAAAAAAgAAAAEAAAAA"
		const { hash } = encodeAdminLink(otherXdr)
		const decoded = decodeAdminLink(hash)
		expect(decoded.xdr).toBe(otherXdr)
	})

	it("produces a hash fragment starting with #tx=", () => {
		const { hash } = encodeAdminLink(SAMPLE_XDR)
		expect(hash.startsWith("#tx=")).toBe(true)
	})

	it("decodes a fragment without the leading # the same way", () => {
		const { hash } = encodeAdminLink(SAMPLE_XDR)
		const decoded = decodeAdminLink(hash.slice(1))
		expect(decoded.xdr).toBe(SAMPLE_XDR)
	})
})

describe("decodeAdminLink malformed input", () => {
	it("throws on a tx value with invalid base64url characters", () => {
		expect(() => decodeAdminLink("#tx=not-valid!!!base64")).toThrow()
	})

	it("throws on a tx value with a misplaced padding character", () => {
		expect(() => decodeAdminLink("#tx=abc=def")).toThrow()
	})
})

describe("decodeAdminLink missing param", () => {
	it("throws when the fragment has no tx key at all", () => {
		expect(() => decodeAdminLink("#foo=bar")).toThrow()
	})

	it("throws on an empty fragment", () => {
		expect(() => decodeAdminLink("")).toThrow()
	})

	it("throws when tx is present but empty", () => {
		expect(() => decodeAdminLink("#tx=")).toThrow()
	})
})
