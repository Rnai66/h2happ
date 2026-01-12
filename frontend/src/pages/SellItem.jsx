// frontend/src/pages/SellItem.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Card from "../components/ui/Card";
import { api } from "../lib/api"; // This one uses fetch wrapper but is now fixed to use correct BASE. 
// OR better yet, use api/index axios instance? 
// The existing code uses `api.post("/items", ...)` later which suggests `import { api } from "../lib/api"` returns a wrapper object with .post 
// BUT looking at previous file content of lib/api.js, it exports `api` function and attaches .get .post etc.
// The critical part is image upload/delete which uses raw `fetch`. We should switch those to use the `api` helper or Axios `api`.

// Let's stick to `api` from `../lib/api` since it's already imported and presumably working for `api.post`. 
// We just need to fix the specific fetch calls to use it, OR fix the constants.
// Actually, `lib/api` was fixed to export `API_BASE` correctly. 
// But here `SellItem` defines its OWN `API_ROOT`. We should remove that.

import { API_BASE } from "../lib/api"; // Import the fixed base from lib

function getRole() {
  try {
    const u = JSON.parse(localStorage.getItem("h2h_user") || "null");
    return u?.role || "user";
  } catch {
    return "user";
  }
}

function maxImagesByRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return 20;
  if (r === "seller_pro" || r === "pro") return 12;
  // seller / user ปกติ
  return 6;
}

export default function SellItem() {
  const nav = useNavigate();
  // ...
  // ...
  async function deleteCloudinaryByPublicId(publicId) {
    // ใช้ api wrapper แทน fetch
    // api wrapper (lib/api) handles token automatically
    const enc = encodeURIComponent(publicId);

    // api() call returns res.json() directly. 
    // And `api` function signature is (path, options).
    // It throws if !res.ok

    return api(`/upload/images/${enc}`, {
      method: "DELETE"
    });
  }

  async function uploadImagesIfNeeded() {
    // ถ้า upload แล้ว ไม่ต้องซ้ำ
    if (uploaded.length > 0) return uploaded;
    if (files.length === 0) return [];

    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    // api wrapper should handle formData if simplified, but lib/api.js implementation:
    // expects Content-Type: application/json by default unless overridden? 
    // And JSON.stringify body... 
    // Wait, lib/api.js: `headers['Content-Type'] = 'application/json'` unless overridden. 
    // And `api.post` does JSON.stringify.
    // We should use the base `api` function directly and handle Headers.

    // Actually, when sending FormData, we should NOT set Content-Type header (browser sets boundary).
    // Checking lib/api.js again (step 93): It forces application/json.
    // So we CANNOT use `api` wrapper easily for FormData unless we create a variant.

    // Alternative: Use RAW fetch but with CORRECT Base URL.
    // We imported API_BASE from lib/api (which is fixed).

    const token = localStorage.getItem("h2h_token") || "";

    // Note: API_BASE from lib/api ends with /api (e.g. .../api)

    const res = await fetch(`${API_BASE}/upload/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Do NOT set Content-Type
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "อัปโหลดรูปไม่สำเร็จ");
    }
    return data && data.files ? data.files : data; // adjust based on actual return
    // Original code:
    // const data = await res.json().catch(() => ({}));
    // if (!res.ok) throw ...
    // const list = (data?.files || [])...
  }

  const list = (data?.files || [])
    .map((x) => ({
      url: x.url,
      publicId: x.publicId,
      thumbUrl: x.thumbUrl || null,
      previewUrl: x.previewUrl || null,
    }))
    .filter((x) => x.url);

  setUploaded(list);
  return list;
}

