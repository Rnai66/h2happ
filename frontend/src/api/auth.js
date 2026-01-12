import { api } from "./index";

export async function login(userId, name) {
  // api has baseURL set (e.g. /api), so we just call /auth/login
  const response = await api.post("/auth/login", { userId, name });
  return response.data; // { token }
}

export async function profile(token) {
  // api interceptor already adds token from localStorage, 
  // but this function takes it as arg. 
  // If this is used for initial load where localStorage might not match arg, we can pass header explicitly.
  const response = await api.get("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // { user: ... }
}

