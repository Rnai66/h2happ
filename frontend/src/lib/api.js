// frontend/src/lib/api.js
import { Capacitor } from "@capacitor/core";

// ให้ตั้ง VITE_API_BASE เป็น http://localhost:4000 หรือ URL backend (ไม่ต้องมี /api ท้าย)
// Render sets VITE_API_URL automatically
let RAW_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://10.0.2.2:4010";

// 🟢 FIX: If running as Native App (Android/iOS), force usage of Emulator Host IP
// (For real device, change this to your LAN IP e.g. 192.168.x.x)
if (Capacitor.isNativePlatform()) {
  RAW_BASE = "http://10.0.2.2:4010";
}

// base จริงของ API = <base>/api   เช่น http://localhost:4000/api
export const API_BASE = RAW_BASE.replace(/\/$/, "") + "/api";

/**
 * wrapper เรียก API:
 *   - ต่อ path ให้เป็น `${API_BASE}${path}`
 *   - ใส่ Content-Type: application/json
 *   - ถ้ามี h2h_token ใน localStorage → ใส่ Authorization: Bearer ...
 */
export async function api(path, options = {}) {
  const token = localStorage.getItem("h2h_token"); // ✅ ใช้ key เดิมที่ login เก็บไว้

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  return res.json();
}

api.get = (path) => api(path, { method: "GET" });

api.post = (path, body = {}) =>
  api(path, { method: "POST", body: JSON.stringify(body) });

api.put = (path, body = {}) =>
  api(path, { method: "PUT", body: JSON.stringify(body) });

api.patch = (path, body = {}) =>
  api(path, { method: "PATCH", body: JSON.stringify(body) });

api.delete = (path) => api(path, { method: "DELETE" });
