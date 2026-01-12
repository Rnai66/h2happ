import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { api } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (password !== password2) {
      setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const data = res.data;

      localStorage.setItem("h2h_token", data.token);
      localStorage.setItem("h2h_user", JSON.stringify(data.user));

      nav("/items");
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">สมัครสมาชิก</h1>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">ชื่อที่แสดง</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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

          <div>
            <label className="block text-sm mb-1">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60"
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-xs text-slate-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="text-blue-600 underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </MainLayout>
  );
}
