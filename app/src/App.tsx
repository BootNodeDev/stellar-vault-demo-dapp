import { Vault } from "@phosphor-icons/react"
import { NavLink, Outlet, Route, Routes } from "react-router-dom"
import ConnectAccount from "./components/ConnectAccount"
import { useIsAdmin } from "./hooks/useIsAdmin"
import AdminPage from "./pages/AdminPage"
import Home from "./pages/Home"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/admin" element={<AdminPage />} />
			</Route>
		</Routes>
	)
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	isActive ? "is-active" : undefined

const AppLayout = () => {
	const { isAdmin } = useIsAdmin()
	return (
		<div className="app-shell">
			<header className="topbar">
				<div className="brand">
					<span className="brand-icon">
						<Vault size={20} weight="bold" />
					</span>
					<span className="brand-name">Stellar Vault Demo</span>
					<span className="brand-sub">Reinsurance Vault</span>
				</div>
				<nav className="topnav">
					<NavLink to="/" end className={navLinkClass}>
						Vault
					</NavLink>
					{isAdmin && (
						<NavLink to="/admin" className={navLinkClass}>
							Admin
						</NavLink>
					)}
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
}

export default App
