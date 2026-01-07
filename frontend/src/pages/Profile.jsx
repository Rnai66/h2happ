// frontend/src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { getToken } from "../lib/auth";

export default function Profile({ me: meFromApp, toast }) {
  const [me, setMe] = useState(meFromApp || null);
  const [loading, setLoading] = useState(!meFromApp);
  const [error, setError] = useState("");

  async function load() {
    const token = getToken();
    if (!token) {
      setError("ยังไม่ได้ล็อกอิน");
      setLoading(false);
      setMe(null);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api("/api/auth/profile"); // api ใส่ Authorization ให้อัตโนมัติแล้ว
      setMe(res.user || null);
    } catch (e) {
      setError(e.message || "โหลดโปรไฟล์ไม่สำเร็จ");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  // ถ้า App ส่ง me มาพร้อมแล้วก็ไม่ต้องโหลดอีก แต่ถ้ากด F5 มาหน้านี้ตรง ๆ ให้ดึงเอง
  useEffect(() => {
    if (meFromApp) {
      setMe(meFromApp);
      setLoading(false);
      setError("");
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meFromApp?._id]); // เมื่อ App อัปเดต me ให้ซิงก์เข้ามา

  if (loading) {
    return (
      <div className="text-[var(--fg-muted)]">Loading profile...</div>
    );
  }

  if (!getToken()) {
    return (
      <div className="space-y-2">
        <div className="text-[var(--fg-muted)]">ยังไม่ได้ล็อกอิน</div>
        <Link to="/login" className="underline">ไปหน้า Login</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-red-400">โหลดโปรไฟล์ไม่สำเร็จ: {error}</div>
        <button
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          onClick={load}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="space-y-3">
        <div className="text-[var(--fg-muted)]">ไม่พบข้อมูลผู้ใช้</div>
        <button
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          onClick={load}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold title-glow">My Profile</h1>

      <div className="rounded-2xl border border-white/10 p-4 bg-white/5 space-y-2">
        <div><span className="text-[var(--fg-muted)]">_id:</span> {me._id}</div>
        <div><span className="text-[var(--fg-muted)]">name:</span> {me.name}</div>
        <div><span className="text-[var(--fg-muted)]">role:</span> {me.role}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          onClick={() => {
            load();
            toast?.("Refreshing profile…");
          }}
        >
          Refresh
        </button>
        <Link to="/items" className="px-3 py-2 rounded-lg bg-blue-700 text-white">
          ไปหน้า Items
        </Link>
      </div>
    </div>
  );
}
