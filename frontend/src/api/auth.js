const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function login(userId, name) {
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  });
  if (!r.ok) throw new Error(`Login failed: ${r.status}`);
  return r.json(); // { token }
}

export async function profile(token) {
  const r = await fetch(`${API_BASE}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Profile failed: ${r.status}`);
  return r.json(); // { user: {_id, name, role} }
}
