import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";

/* =========================
   Header (Desktop)
========================================================= */
function H2HHeader() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");

  const { user, tokenBalance, isAuthenticated, logout, isAdmin } = useAuth();

  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    nav("/search?q=" + encodeURIComponent(query));
  }

  function handleLogout() {
    const ok = window.confirm("ต้องการออกจากระบบหรือไม่?");
    if (!ok) return;
    logout();
    nav("/auth?tab=login");
  }

  return (
    <header className="text-white shadow-silk backdrop-blur transition-colors duration-300"
      style={{ background: 'var(--bg-header)' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center
                      justify-between gap-3 px-4 py-3">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide hover:text-white/80 transition"
          style={{ color: 'var(--accent-primary)' }}
        >
          🐘 H2H Thailand
        </Link>

        {/* Search */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 flex-1 md:flex-initial"
        >
          <input
            type="text"
            placeholder="🔍 ค้นหาสินค้า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h2h-input w-full md:w-72 border-2 focus:ring-2 shadow-sm"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)'
            }}
          />
          <button
            type="submit"
            className="h2h-btn px-4 py-2 text-sm font-medium shadow-silk active:scale-[.97]"
          >
            ค้นหา
          </button>
        </form>

        {/* Nav */}
        <nav className="flex flex-wrap items-center justify-center gap-3
                        text-sm font-medium"
          style={{ color: 'var(--text-main)' }}>
          {isAuthenticated ? (
            <>
              <Link to="/sell" className="hover:opacity-75 transition">
                ขายของ
              </Link>
              <Link to="/orders" className="hover:opacity-75 transition">
                คำสั่งซื้อ
              </Link>
              <Link to="/chat" className="hover:opacity-75 transition">
                แชต
              </Link>

              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* Token */}
              <div className="px-3 py-1 rounded-2xl
                              border text-[11px]
                              leading-tight flex flex-col items-start"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)'
                }}>
                <span className="uppercase tracking-wide text-[10px] opacity-80">
                  Tokens
                </span>
                <span className="text-sm font-semibold">
                  {tokenBalance ?? 0} 🎟
                </span>
              </div>

              {/* Role Badge */}
              <Link
                to={isAdmin ? "/admin/dashboard" : "#"}
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300
                  ${isAdmin
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.5)] backdrop-blur-md hover:bg-indigo-500/30 hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]'
                    : user?.role === 'seller' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 cursor-default'}`}
              >
                {user?.role || "USER"}
              </Link>

              {/* User */}
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="px-3 py-1 rounded-full
                             hover:brightness-110 transition
                             flex items-center gap-2 text-xs md:text-sm"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                  <span className="inline-flex items-center justify-center
                                   w-7 h-7 rounded-full
                                   text-xs font-semibold"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="max-w-[120px] truncate">
                    {user?.name || "ผู้ใช้"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full
                             border text-xs md:text-sm
                             hover:bg-white/10 transition"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  type="button"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth?tab=login" className="hover:text-h2h-gold transition" style={{ color: 'var(--accent-primary)' }}>
                เข้าสู่ระบบ
              </Link>
              <Link to="/auth?tab=register" className="hover:text-h2h-gold transition" style={{ color: 'var(--accent-primary)' }}>
                สมัครสมาชิก
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


/* =========================
   Mobile Header
========================================================= */
function MobileHeader() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const { user, isAdmin } = useAuth();

  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    nav("/search?q=" + encodeURIComponent(query));
  }

  return (
    <div className="md:hidden sticky top-0 z-30
                    backdrop-blur-md shadow-lg border-b
                    px-4 py-3 flex flex-col gap-3 transition-colors duration-300"
      style={{
        background: 'var(--bg-header)',
        borderColor: 'var(--border-color)'
      }}>

      <div className="flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-wide drop-shadow-md"
          style={{ color: 'var(--text-main)' }}>
          🐘 H2H Thailand
        </Link>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          {/* Role Badge if logged in */}
          {user && (
            <Link
              to={isAdmin ? "/admin/dashboard" : "#"}
              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all
                    ${isAdmin
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.4)] backdrop-blur-md'
                  : user?.role === 'seller' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
            >
              {user?.role}
            </Link>
          )}
          <div className="text-[10px] font-light" style={{ color: 'var(--text-muted)' }}>
            v0.1.67
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="relative w-full">
        <input
          type="text"
          placeholder="🔍 ค้นหาสินค้า..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border-2
                     px-4 py-2 text-sm backdrop-blur-sm shadow-sm
                     focus:outline-none focus:ring-2 transition placeholder-opacity-70"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-main)',
            caretColor: 'var(--accent-primary)'
          }}
        />
      </form>
    </div>
  );
}

/* =========================
   Mobile Bottom Navigation
========================================================= */
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
      <div className="mx-3 mb-3 pointer-events-auto
                      backdrop-blur-xl border
                      rounded-2xl shadow-2xl
                      grid grid-cols-5 py-3 text-[10px]"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)'
        }}>
        <Link to="/" className="flex flex-col items-center gap-1 hover:brightness-125 transition">
          <span className="text-lg">🏠</span>
          <span>หน้าแรก</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center gap-1 hover:brightness-125 transition">
          <span className="text-lg">📦</span>
          <span>คำสั่งซื้อ</span>
        </Link>
        <Link to="/sell" className="flex flex-col items-center gap-1 font-semibold -mt-5">
          <span className="rounded-full p-3 shadow-lg border-4"
            style={{
              background: 'linear-gradient(to top right, var(--accent-secondary), var(--accent-primary))',
              borderColor: 'var(--bg-main)',
              color: 'white'
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <span style={{ color: 'var(--text-main)' }} className="mt-1">ขาย</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-1 hover:brightness-125 transition">
          <span className="text-lg">💬</span>
          <span>แชต</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 hover:brightness-125 transition">
          <span className="text-lg">👤</span>
          <span>ฉัน</span>
        </Link>
      </div>
    </nav>
  );
}

/* =========================
   Main Layout
========================================================= */
export default function MainLayout({ children }) {
  return (
    <div className="h2h-frame relative">
      <div className="h2h-frame-inner min-h-screen flex flex-col relative overflow-hidden">

        {/* Theme Switcher Removed (Moved to Header) */}

        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700"
          style={{ background: 'var(--accent-secondary)', opacity: 0.15 }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700"
          style={{ background: 'var(--accent-primary)', opacity: 0.1 }} />

        {/* Desktop Header */}
        <div className="hidden md:block sticky top-0 z-50">
          <H2HHeader />
        </div>

        {/* Mobile Header (New) */}
        <MobileHeader />

        {/* Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto
                         px-4 py-4 md:py-6
                         pb-28 md:pb-6 relative z-10 text-[color:var(--text-main)]">
          {children || <Outlet />}
        </main>

        {/* Desktop Footer */}
        <footer className="hidden md:block h2h-footer
                           text-center text-xs py-4 relative z-10"
          style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} H2H Thailand — Surin Digital Silk Heritage Edition
        </footer>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
