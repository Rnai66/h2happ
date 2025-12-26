import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

/* =========================
   Header (Desktop)
========================= */
function H2HHeader() {
  const nav = useNavigate();
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
                       text-white shadow-silk backdrop-blur">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center
                      justify-between gap-3 px-4 py-3">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide hover:text-h2h-gold transition"
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
            className="h2h-input w-full md:w-72 rounded-xl border-0
                       text-slate-900 placeholder:text-slate-500
                       focus:ring-2 focus:ring-h2h-gold"
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

        {/* Nav */}
        <nav className="flex flex-wrap items-center justify-center gap-3
                        text-sm font-medium">
          {isAuthenticated ? (
            <>
              <Link to="/sell" className="hover:text-h2h-gold transition">
                ขายของ
              </Link>
              <Link to="/orders" className="hover:text-h2h-gold transition">
                คำสั่งซื้อ
              </Link>
              <Link to="/chat" className="hover:text-h2h-gold transition">
                แชต
              </Link>

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
                  <span className="inline-flex items-center justify-center
                                   w-7 h-7 rounded-full bg-white/25
                                   text-xs font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="max-w-[120px] truncate">
                    {user?.name || "ผู้ใช้"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full
                             border border-white/40 text-xs md:text-sm
                             hover:bg-white/10 hover:border-white transition"
                  type="button"
                >
                  ออกจากระบบ
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
    </header>
  );
}

/* =========================
   Mobile Bottom Navigation
========================= */
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="mx-3 mb-3 h2h-card rounded-2xl
                      grid grid-cols-5 py-2 text-xs text-white">
        <Link to="/" className="flex flex-col items-center gap-1 opacity-80">
          <span>🏠</span>
          <span>หน้าแรก</span>
        </Link>
        <Link to="/items" className="flex flex-col items-center gap-1 opacity-80">
          <span>🛍</span>
          <span>สินค้า</span>
        </Link>
        <Link to="/sell" className="flex flex-col items-center gap-1 font-semibold">
          <span className="bg-gradient-to-tr from-blue-500 to-yellow-400
                           text-black rounded-xl px-3 py-1">
            ＋
          </span>
          <span>ขาย</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-1 opacity-80">
          <span>💬</span>
          <span>แชต</span>
        </Link>
        <Link to="/me/listings" className="flex flex-col items-center gap-1 opacity-80">
          <span>👤</span>
          <span>ฉัน</span>
        </Link>
      </div>
    </nav>
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
        <div className="md:hidden sticky top-0 z-30
                        bg-gradient-to-r from-[#0B3D91] to-[#D4AF37]
                        text-white px-4 py-3">
          <Link to="/" className="font-semibold tracking-wide">
            🐘 H2H Thailand
          </Link>
        </div>

        {/* Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto
                         px-4 py-4 md:py-6
                         pb-24 md:pb-6">
          {children || <Outlet />}
        </main>

        {/* Desktop Footer */}
        <footer className="hidden md:block h2h-footer
                           text-center text-xs text-white/60 py-4">
          © {new Date().getFullYear()} H2H Thailand — Surin Digital Silk Heritage Edition
        </footer>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
