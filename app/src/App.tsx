import { Vault } from "@phosphor-icons/react"
import { NavLink, Outlet, Route, Routes } from "react-router-dom"
import ConnectAccount from "./components/ConnectAccount"
import Debug from "./pages/Debug"
import Home from "./pages/Home"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
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
			<nav className="topnav">
				<NavLink to="/" end className={({ isActive }) => (isActive ? "is-active" : "")}>
					Vault
				</NavLink>
				<NavLink
					to="/debug"
					className={({ isActive }) => (isActive ? "is-active" : "")}
				>
					Explorer
				</NavLink>
			</nav>
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
