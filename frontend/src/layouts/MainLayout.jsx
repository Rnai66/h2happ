import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationDropdown from "../components/NotificationDropdown";

/* =========================
   Theme Toggle Component
   ========================= */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

/* =========================
   Header (Desktop)
========================= */
function H2HHeader() {
  const nav = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  const { user, tokenBalance, isAuthenticated, logout } = useAuth();

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
    <header className="bg-gradient-to-r from-[#0B3D91]/95 via-[#123d85]/90 to-[#D4AF37]/90
                       text-white shadow-silk backdrop-blur transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center
                      justify-between gap-3 px-4 py-3">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide hover:text-h2h-gold transition"
        >
          <span key={location.pathname} className="elephant-anim">🐘</span> H2H Thailand
        </Link>

        {/* Search */}
        <div className="flex-1 flex items-center justify-center">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 w-full max-w-md"
          >
            <input
              type="text"
              placeholder="🔍 ค้นหาสินค้า..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h2h-input w-full rounded-xl border-0
                        text-slate-900 placeholder:text-slate-500
                        focus:ring-2 focus:ring-h2h-gold shadow-silk"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white
                        bg-gradient-to-r from-[#D4AF37] to-[#f1d673]
                        hover:from-[#f1d673] hover:to-[#D4AF37]
                        shadow-silk active:scale-[.97] transition"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap items-center justify-center gap-3
                        text-sm font-medium">

          <ThemeToggle /> {/* ☀️🌙 */}

          {isAuthenticated ? (
            <>
              <Link to="/sell" className="hover:text-h2h-gold transition hidden lg:block">
                ขายของ
              </Link>
              <Link to="/orders" className="hover:text-h2h-gold transition hidden lg:block">
                คำสั่งซื้อ
              </Link>
              <Link to="/chat" className="hover:text-h2h-gold transition hidden lg:block">
                แชต
              </Link>

              {/* Notification */}
              <div className="mx-1">
                <NotificationDropdown />
              </div>

              {/* Token */}
              <div className="px-3 py-1 rounded-2xl bg-white/15
                              border border-white/30 text-[11px]
                              leading-tight flex flex-col items-start">
                <span className="uppercase tracking-wide text-[10px] opacity-80">
                  Tokens
                </span>
                <span className="text-sm font-semibold">
                  {tokenBalance ?? 0} 🎟
                </span>
              </div>

              {/* User */}
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="px-3 py-1 rounded-full bg-white/15
                             hover:bg-white/25 transition
                             flex items-center gap-2 text-xs md:text-sm"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border border-white/30"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center
                                       w-7 h-7 rounded-full bg-white/25
                                       text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate hidden xl:inline">
                    {user?.name || "ผู้ใช้"}
                  </span>
                </Link>

                <Link
                  to="/settings"
                  className="px-2 py-1 rounded-full border border-white/40 text-xs md:text-sm hover:bg-white/10 hover:border-white transition"
                  title="ตั้งค่า"
                >
                  ⚙️
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full
                             border border-white/40 text-xs md:text-sm
                             hover:bg-white/10 hover:border-white transition"
                  type="button"
                >
                  ออก
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth?tab=login" className="hover:text-h2h-gold transition">
                เข้าสู่ระบบ
              </Link>
              <Link to="/auth?tab=register" className="hover:text-h2h-gold transition">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </nav>
      </div>
    </header >
  );
}

/* =========================
   Mobile Bottom Navigation
========================= */
function MobileBottomNav() {
  const { user } = useAuth();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe">
      <div className="mx-3 mb-3 h2h-card rounded-2xl
                      grid grid-cols-5 py-2 text-xs backdrop-blur-md">
        <Link to="/" className="flex flex-col items-center gap-1 hover:text-h2h-gold transition text-[var(--text-muted)] dark:text-white/80 font-medium">
          <span className="text-lg">🏠</span>
          <span>หน้าแรก</span>
        </Link>
        <Link to="/items" className="flex flex-col items-center gap-1 hover:text-h2h-gold transition text-[var(--text-muted)] dark:text-white/80 font-medium">
          <span className="text-lg">🛍</span>
          <span>สินค้า</span>
        </Link>
        <Link to="/sell" className="flex flex-col items-center gap-1 font-semibold -mt-5">
          <span className="bg-gradient-to-tr from-blue-600 to-yellow-400
                           text-white rounded-full w-12 h-12 flex items-center justify-center
                           shadow-lg ring-4 ring-white/50 dark:ring-black/50">
            <span className="text-xl">＋</span>
          </span>
          <span className="mt-1 text-[var(--text-main)] dark:text-white font-medium">ขาย</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-1 hover:text-h2h-gold transition text-[var(--text-muted)] dark:text-white/80 font-medium">
          <span className="text-lg">💬</span>
          <span>แชต</span>
        </Link>
        <Link to="/me/listings" className="flex flex-col items-center gap-1 hover:text-h2h-gold transition text-[var(--text-muted)] dark:text-white/80 font-medium">
          {user?.avatar ? (
            <img src={user.avatar} alt="Me" className="w-6 h-6 rounded-full object-cover border border-white/50 shadow-sm" />
          ) : (
            <span className="text-lg">👤</span>
          )}
          <span>ฉัน</span>
        </Link>
      </div>
    </nav>
  );
}

/* =========================
   Mobile Top Header
========================= */
function MobileHeader() {
  const nav = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const { user, tokenBalance, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    nav("/search?q=" + encodeURIComponent(query));
  }

  return (
    <div className="md:hidden sticky top-0 z-30 bg-gradient-to-r from-[#0B3D91] to-[#D4AF37] text-white shadow-md pb-2">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-semibold tracking-wide text-lg flex items-center gap-2">
          <span key={location.pathname} className="elephant-anim">🐘</span> H2H
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle /> {/* ☀️🌙 */}

          {isAuthenticated && (
            <>
              {/* Tokens */}
              <div className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] flex items-center gap-1">
                <span className="opacity-80">tokens</span>
                <span className="font-bold">{tokenBalance ?? 0}</span>
              </div>

              {/* Orders Link */}
              <Link to="/orders" className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition">
                <span className="material-icons-round text-sm">📦</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-1">
        <form onSubmit={onSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 ค้นหาสินค้า..."
            className="w-full bg-white/90 text-slate-900 placeholder:text-slate-500 text-sm rounded-lg py-2 pl-3 pr-10 border-0 focus:ring-2 focus:ring-h2h-gold shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-yellow-500 rounded-md text-white shadow-sm"
          >
            <span className="text-xs">Go</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Main Layout
========================= */
export default function MainLayout({ children }) {
  return (
    <div className="h2h-frame">
      {/* ❌ ลบ text-slate-900 ออก */}
      <div className="h2h-frame-inner min-h-screen flex flex-col">

        {/* Desktop Header */}
        <div className="hidden md:block">
          <H2HHeader />
        </div>

        {/* Mobile Top Bar */}
        <MobileHeader />

        {/* Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto
                         px-4 py-4 md:py-6
                         pb-24 md:pb-6">
          {children || <Outlet />}
        </main>

        {/* Desktop Footer */}
        <footer className="hidden md:block h2h-footer
                           text-center text-xs text-slate-600 dark:text-slate-400 py-4">
          © {new Date().getFullYear()} H2H Thailand — Surin Digital Silk Heritage Edition
        </footer>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
