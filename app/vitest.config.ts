import { defineConfig } from "vitest/config"

// Scoped to src/lib: pure-logic modules only. No React/DOM environment needed —
// component testing is out of scope per this repo's convention (manual/E2E instead).
export default defineConfig({
	test: {
		include: ["src/lib/**/*.test.ts"],
		environment: "node",
		passWithNoTests: true,
	},
})
