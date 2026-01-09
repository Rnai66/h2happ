// frontend/src/main.jsx หรือ index.jsx (ตามที่คุณใช้ไฟล์นี้อยู่)
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/theme.css";
import App from "./App";

// 🔐 ดึง AuthProvider + useAuth
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

function H2HHeader() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // ✅ ดึงข้อมูลจาก AuthContext แทน localStorage
  const { user, tokenBalance, isAuthenticated, logout } = useAuth();

  function handleSearch(e) {
    e.preventDefault();
    nav("/search?q=" + encodeURIComponent(q));
  }

  function handleLogout() {
    logout(); // เคลียร์ token + user ใน context + localStorage
    nav("/auth?tab=login");
  }

  return (
    <header className="h2h-header">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        {/* โลโก้ / ชื่อแบรนด์ */}
        <Link to="/" className="font-semibold">
          H2H Thailand
        </Link>

        {/* ค้นหา (desktop ขึ้นไป) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center gap-2 flex-1 justify-center"
        >
          <input
            className="h2h-input w-72"
            placeholder="ค้นหา…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="h2h-btn-tonal" type="submit">
            ค้นหา
          </button>
        </form>

        {/* เมนูด้านขวา */}
        <nav className="flex items-center gap-3 text-sm">
          {!isAuthenticated && (
            <>
              <Link to="/auth?tab=login" className="hover:underline">
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/auth?tab=register"
                className="px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <>
              {/* เมนูหลัก เมื่อ login แล้ว */}
              <Link to="/sell" className="hover:underline">
                ขายของ
              </Link>
              <Link to="/orders" className="hover:underline">
                คำสั่งซื้อ
              </Link>
              <Link to="/chat" className="hover:underline">
                แชต
              </Link>

              {/* แสดงชื่อ + role + Tokens */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs text-slate-500">สวัสดี</div>
                    <div className="text-sm font-medium text-slate-900">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-emerald-600">
                      {user.role === "seller" ? "Seller" : "Buyer"}
                    </div>
                  </div>
                </div>

                {/* 🎟 แสดงจำนวน Tokens */}
                <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] leading-tight text-amber-700">
                  <div className="font-semibold text-xs">
                    {tokenBalance ?? 0} Tokens
                  </div>
                  <div>สำหรับโปรโมต /สิทธิพิเศษ</div>
                </div>
              </div>

              {/* ปุ่มออกจากระบบ */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1 rounded-full border border-slate-300 text-xs hover:bg-slate-100"
              >
                ออกจากระบบ
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function MainLayout({ children }) {
  return (
    <div className="h2h-frame">
      <div className="h2h-frame-inner min-h-screen flex flex-col">
        <H2HHeader />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
          {children || <Outlet />}
        </main>
        <footer className="h2h-footer">
          © {new Date().getFullYear()} H2H Thailand — Surin Silk • Mourning
          Edition
        </footer>
      </div>
    </div>
  );
}

// Entry point
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
