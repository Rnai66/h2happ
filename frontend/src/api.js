const RAW = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const API_BASE = RAW.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

export const api = {
  // dev login เดิม แค่เปลี่ยน path ไม่ให้ซ้อน /api
  loginDevBuyer() {
    return jsonFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "buyerA", password: "buyerA" }),
    });
  },

  loginDevSeller() {
    return jsonFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "sellerB", password: "sellerB" }),
    });
  },

  getItem(id) {
    return jsonFetch(`/items/${id}`);
  },

  listItems(query = "") {
    const q = query ? `?${query}` : "";
    return jsonFetch(`/items${q}`);
  },

  createItem(token, payload) {
    return jsonFetch("/items", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
};
export default api;
