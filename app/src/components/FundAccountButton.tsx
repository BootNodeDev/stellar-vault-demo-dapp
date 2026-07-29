import { fundAccount } from "@stellar-scaffold/app-lib"
import React, { useTransition } from "react"
import { useNotification } from "@/hooks/useNotification"
import { useWallet } from "@/hooks/useWallet"

const FundAccountButton: React.FC = () => {
	const { addNotification } = useNotification()
	const [isPending, startTransition] = useTransition()
	const { address } = useWallet()

	if (!address) return null

	const handleFundAccount = () => {
		startTransition(async () => {
			const { ok, message } = await fundAccount(address)
			addNotification(message, ok ? "success" : "error")
		})
	}

	return (
		<button
			disabled={isPending}
			onClick={handleFundAccount}
			title="Fund your account with test XLM via Friendbot"
		>
			Fund Account
		</button>
	)
}

export default FundAccountButton
