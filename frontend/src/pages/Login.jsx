// frontend/src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";

const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_ROOT = RAW_BASE.replace(/\/$/, "").replace(/\/api$/, "");

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      localStorage.setItem("h2h_token", data.token);
      localStorage.setItem("h2h_user", JSON.stringify(data.user));

      // กลับไปหน้าสินค้าหรือหน้าก่อนหน้า
      nav("/items");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-xs text-slate-600">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-blue-600 underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </MainLayout>
  );
}
