// Transport for the admin flow: a signed/unsigned transaction envelope travels
// as a base64url payload in the app's own `#tx=` hash fragment — copy-paste and
// back-button friendly, no server involved. This is a bespoke hash-fragment
// transport, NOT a SEP-7 `web+stellar:` URI. The fragment is untrusted input, so
// decoding validates strictly and never attempts a partial/garbled result.

const BASE64_URL_CHARS = /^[A-Za-z0-9_-]+$/

export interface AdminLink {
	hash: string
}

export interface DecodedAdminLink {
	xdr: string
}

function toBase64Url(base64: string): string {
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(base64url: string): string {
	const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
	const padLength = (4 - (base64.length % 4)) % 4
	return base64 + "=".repeat(padLength)
}

export function encodeAdminLink(xdr: string): AdminLink {
	return {
		hash: `#tx=${toBase64Url(xdr)}`,
	}
}

export function decodeAdminLink(fragment: string): DecodedAdminLink {
	const withoutHash = fragment.startsWith("#") ? fragment.slice(1) : fragment
	const params = new URLSearchParams(withoutHash)
	const tx = params.get("tx")

	if (!tx) {
		throw new Error("Invalid admin link: missing tx parameter")
	}
	if (!BASE64_URL_CHARS.test(tx)) {
		throw new Error("Invalid admin link: malformed tx parameter")
	}

	const base64 = fromBase64Url(tx)
	try {
		atob(base64)
	} catch {
		throw new Error("Invalid admin link: tx parameter is not valid base64url")
	}

	return { xdr: base64 }
}
