import { animate, useMotionValue, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface Props {
	value: number
	decimals?: number
	prefix?: string
	suffix?: string
}

// Tween the figure only when the underlying data CHANGES — not a page-load
// count-up. First render shows the real value instantly.
export function AnimatedNumber({
	value,
	decimals = 2,
	prefix = "",
	suffix = "",
}: Props) {
	const reduce = useReducedMotion()
	const mv = useMotionValue(value)
	const [display, setDisplay] = useState(value)
	const first = useRef(true)

	useEffect(() => {
		if (first.current) {
			first.current = false
			setDisplay(value)
			return
		}
		if (reduce) {
			setDisplay(value)
			return
		}
		const controls = animate(mv, value, {
			duration: 0.35,
			ease: [0.16, 1, 0.3, 1],
		})
		const unsub = mv.on("change", (v) => setDisplay(v))
		return () => {
			controls.stop()
			unsub()
		}
	}, [value, reduce, mv])

	return (
		<span className="mono">
			{prefix}
			{display.toLocaleString("en-US", {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			})}
			{suffix}
		</span>
	)
}
