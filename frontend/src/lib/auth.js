// src/lib/auth.js
// Utility สำหรับจัดการ JWT token + ข้อมูลผู้ใช้ฝั่ง frontend

const TOKEN_KEY = "h2h_token";
const USER_KEY = "h2h_user";

/** อ่าน token จาก localStorage */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/** บันทึกหรือเคลียร์ token */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // เงียบไว้ ไม่ให้แอปพังถ้า localStorage ใช้ไม่ได้
  }
}

/** เคลียร์ token + user ทั้งหมด */
export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

/** ถอดรหัส payload ของ JWT (base64 → JSON) */
export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // decodeURIComponent(escape(...)) ช่วยเรื่อง UTF-8
    const json = decodeURIComponent(escape(atob(payload)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** อ่าน user ที่เคยเซฟไว้ตรง ๆ (h2h_user) ถ้ามี */
function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * คืนค่าผู้ใช้ปัจจุบันจาก token / localStorage ถ้ามี
 *
 * รูปแบบที่คืน:
 * {
 *   _id: "...",
 *   id: "...",
 *   email: "...",
 *   name: "...",
 *   role: "user" | "seller" | "admin",
 *   exp: <timestamp>
 * }
 */
export function getUser() {
  const token = getToken();
  const fromStorage = getStoredUser();

  let payload = null;
  if (token) {
    payload = decodeJwt(token);
  }

  // ถ้า token ใช้ได้ + ยังไม่หมดอายุ → เชื่อ token เป็นหลัก
  if (payload) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // token หมดอายุแล้ว → เคลียร์ทิ้ง
      logout();
      return null;
    }

    const id =
      payload._id || payload.id || payload.userId || payload.sub || null;

    return {
      _id: id,
      id,
      email: payload.email || fromStorage?.email || "",
      name: payload.name || payload.username || fromStorage?.name || "",
      role: payload.role || fromStorage?.role || "user",
      exp: payload.exp,
    };
  }

  // ถ้าไม่มี token แต่เคยเซฟ user ไว้ ก็คืนแบบ simple
  if (fromStorage) {
    const id =
      fromStorage._id ||
      fromStorage.id ||
      fromStorage.userId ||
      fromStorage.sub ||
      null;

    return {
      _id: id,
      id,
      email: fromStorage.email || "",
      name: fromStorage.name || "",
      role: fromStorage.role || "user",
      exp: null,
    };
  }

  return null;
}

/** helper ไว้เช็กเร็ว ๆ ว่าล็อกอินอยู่ไหม */
export function isLoggedIn() {
  return !!getUser();
}
