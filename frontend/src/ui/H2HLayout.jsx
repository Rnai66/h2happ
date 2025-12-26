import { Outlet, Link, NavLink } from "react-router-dom";

export default function H2HLayout({ me, onLogout }) {
  const linkClass = ({ isActive, isPending }) =>
    `nav-link ${isActive ? "nav-link-active" : ""} ${isPending ? "opacity-60" : ""}`;

  const displayName =
    me?.email || me?.name || me?._id || "Signed in";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <nav className="navbar sticky top-0 z-40">
        <div className="section flex items-center gap-3">
          <Link
            to="/"
            className="text-2xl font-bold title-glow tracking-wide mr-1"
          >
            H2H Thailand
          </Link>

          {/* Left nav */}
          <NavLink to="/items" className={linkClass}>
            <span className="material-icons-round">inventory_2</span>
            <span>Items</span>
          </NavLink>

          {me?.role === "admin" && (
            <>
              <NavLink to="/users" className={linkClass}>
                <span className="material-icons-round">group</span>
                <span>Users</span>
              </NavLink>
              <NavLink to="/payments" className={linkClass}>
                <span className="material-icons-round">account_balance_wallet</span>
                <span>Payments</span>
              </NavLink>
              <NavLink to="/tokens" className={linkClass}>
                <span className="material-icons-round">token</span>
                <span>Tokens</span>
              </NavLink>
            </>
          )}

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {me ? (
              <>
                <span className="nav-badge">
                  <span className="material-icons-round" style={{ fontSize: 16 }}>
                    mail
                  </span>
                  {displayName}
                </span>
                <NavLink to="/profile" className={linkClass}>
                  <span className="material-icons-round">person</span>
                  <span>Profile</span>
                </NavLink>
                <button
                  className="nav-auth-gold inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                  onClick={onLogout}
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    logout
                  </span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="nav-auth inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    login
                  </span>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="nav-auth-gold inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    how_to_reg
                  </span>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 section">
        <Outlet />
      </main>
    </div>
  );
}
