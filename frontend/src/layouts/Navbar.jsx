// frontend/src/components/layout/Navbar.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, tokenBalance, isAuthenticated, logout } = useAuth();
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <header className="w-full px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
      <Link to="/" className="font-semibold text-blue-700">
        H2H Thailand
      </Link>

      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 text-right">
            <div className="font-medium">{user?.name || "ผู้ใช้ H2H"}</div>
            <div className="flex items-center gap-1">
              <span className="text-amber-500 font-semibold">
                {tokenBalance}
              </span>
              <span className="text-[10px] uppercase tracking-wide">
                Tokens
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-100"
          >
            ออกจากระบบ
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/login"
            className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            สมัคร +10 Tokens
          </Link>
        </div>
      )}
    </header>
  );
}
