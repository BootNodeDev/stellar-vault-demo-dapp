import { Vault } from "@phosphor-icons/react"
import { Outlet, Route, Routes } from "react-router-dom"
import ConnectAccount from "./components/ConnectAccount"
import Home from "./pages/Home"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
			</Route>
		</Routes>
	)
}

const AppLayout = () => (
	<div className="app-shell">
		<header className="topbar">
			<div className="brand">
				<span className="brand-icon">
					<Vault size={20} weight="bold" />
				</span>
				<span className="brand-name">Ballast</span>
				<span className="brand-sub">Reinsurance Vault</span>
			</div>
			<div className="topbar-right">
				<ConnectAccount />
			</div>
		</header>

		<main className="main">
			<Outlet />
		</main>

		<footer className="foot">Stellar Testnet · Soroban · bvUSDC</footer>
	</div>
)

export default App
