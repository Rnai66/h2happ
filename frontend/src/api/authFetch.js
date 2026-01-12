// frontend/src/api/authFetch.js
import { Capacitor } from "@capacitor/core";

let RAW_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://10.0.2.2:4010";

// 🟢 FIX: If running as Native App (Android/iOS), force usage of Emulator Host IP
if (Capacitor.isNativePlatform()) {
  RAW_BASE = "http://10.0.2.2:4010";
}

const API_ROOT = RAW_BASE.replace(/\/$/, "").replace(/\/api$/, "");

export function getToken() {
  return localStorage.getItem("h2h_token") || "";
}

function withNoCache(url) {
  // เติม _ts กัน 304/cached response แบบชัวร์
  const u = new URL(url, API_ROOT);
  u.searchParams.set("_ts", String(Date.now()));
  return u.toString();
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // ✅ กัน cache ฝั่ง browser/proxy
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");

  // ใส่ JSON header ถ้ามี body และไม่ใช่ FormData
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // ✅ เติม _ts กัน 304 แน่นอน
  const url = withNoCache(path);

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store", // ✅ สำคัญ
  });

  // ✅ เคส 304 จะไม่มี body — อย่าพัง
  if (res.status === 304) {
    return { ok: true, notModified: true };
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
