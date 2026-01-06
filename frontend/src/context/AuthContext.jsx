// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// ใช้ api wrapper เดิมของโปรเจกต์
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // โหลดจาก localStorage ตอนเปิดแอป
  useEffect(() => {
    const storedToken = localStorage.getItem("h2h_token");
    const storedUser = localStorage.getItem("h2h_user");

    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (storedToken) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลโปรไฟล์ + tokenBalance จาก backend
  async function fetchProfile() {
    try {
      const res = await api("/profile/me");
      // console.log("profile/me response:", res);

      const userFromApi = res.user || null;

      const balanceFromRoot =
        typeof res.tokenBalance === "number" ? res.tokenBalance : null;

      const balanceFromUser =
        userFromApi && typeof userFromApi.tokenBalance === "number"
          ? userFromApi.tokenBalance
          : null;

      const finalBalance =
        balanceFromRoot ?? balanceFromUser ?? 0;

      if (userFromApi) {
        setUser(userFromApi);
        localStorage.setItem("h2h_user", JSON.stringify(userFromApi));
      }
      setTokenBalance(finalBalance);
    } catch (err) {
      console.error("fetchProfile failed", err);
    }
  }

  function applyAuthFromResponse(data) {
    const { token, user, tokenBalance } = data || {};

    if (token) {
      setToken(token);
      localStorage.setItem("h2h_token", token);
    }

    if (user) {
      setUser(user);
      localStorage.setItem("h2h_user", JSON.stringify(user));
    }

    if (typeof tokenBalance === "number") {
      setTokenBalance(tokenBalance);
    }
  }

  // ✅ RBAC Helpers
  const isAdmin = user?.role === "admin";

  function hasRole(roleName) {
    return user?.role === roleName;
  }

  function hasPermission(permissionName) {
    if (isAdmin) return true; // Admin gets everything
    return user?.permissions?.includes(permissionName);
  }

  // 🔐 Login
  async function login({ email, password }) {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // res คือ JSON data
    applyAuthFromResponse(res);

    // ถ้า response ไม่มี tokenBalance ให้ดึงจาก profile
    if (typeof res.tokenBalance !== "number") {
      await fetchProfile();
    }
  }

  // 🆕 Register + Reward 10 Tokens
  async function register({ name, email, password, phone }) {
    // 1) สมัคร
    const res = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    applyAuthFromResponse(res);

    // 2) แจก 10 Tokens
    try {
      const rewardRes = await api("/token/reward", {
        method: "POST",
        body: JSON.stringify({
          amount: 10,
          reason: "signup_bonus",
        }),
      });

      // รองรับทั้งกรณีส่ง tokenBalance ตรง ๆ หรืออยู่ใน user
      const balanceFromRoot =
        typeof rewardRes.tokenBalance === "number"
          ? rewardRes.tokenBalance
          : null;

      const balanceFromUser =
        rewardRes.user && typeof rewardRes.user.tokenBalance === "number"
          ? rewardRes.user.tokenBalance
          : null;

      const finalBalance =
        balanceFromRoot ?? balanceFromUser ?? tokenBalance ?? 0;

      setTokenBalance(finalBalance);

      if (rewardRes.user) {
        setUser(rewardRes.user);
        localStorage.setItem("h2h_user", JSON.stringify(rewardRes.user));
      } else {
        await fetchProfile();
      }
    } catch (err) {
      console.error("reward tokens failed", err);
      await fetchProfile();
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    setTokenBalance(0);
    localStorage.removeItem("h2h_token");
    localStorage.removeItem("h2h_user");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokenBalance,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
        isAdmin,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
