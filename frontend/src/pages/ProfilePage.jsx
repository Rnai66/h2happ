import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { H2HCard, H2HButton, H2HTag, H2HSkeleton } from "../ui";
import { authFetch } from "../api/authFetch"; // ✅ ใช้ตัวนี้แนบ token

export default function ProfilePage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const data = await authFetch("/api/profile/me");

        if (!mounted) return;

        const u = data?.user || null;
        if (!u) {
          setUser(null);
          setErr("ไม่พบข้อมูลผู้ใช้");
          return;
        }

        // ✅ map ให้เข้ากับ UI เดิม
        const displayName = u.displayName || u.name || "User";
        const role = u.role || "user";
        const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();

        setUser({
          name: displayName,
          email: u.email || "-",
          role: role === "seller" ? "Seller" : role === "admin" ? "Admin" : role,
          joined: createdAt.toISOString().slice(0, 10),
          avatar:
            u.avatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              displayName
            )}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        });

        setTokenBalance(Number.isFinite(data?.tokenBalance) ? data.tokenBalance : 0);
      } catch (e) {
        if (!mounted) return;

        // ✅ token หมด/ไม่มี token → ไป login
        if (e?.status === 401) {
          nav("/login");
          return;
        }
        setErr(e?.message || "โหลดโปรไฟล์ไม่สำเร็จ");
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [nav]);

  function handleLogout() {
    localStorage.removeItem("h2h_token");
    localStorage.removeItem("h2h_user");
    nav("/login");
  }

  return (
    <div className="section page-fade">
      {/* Header */}
      <div className="mb-6">
        <h1 className="title-glow mb-1">My Profile</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          ข้อมูลส่วนตัวของคุณในระบบ H2H Thailand
        </p>
      </div>

      <H2HCard className="max-w-xl mx-auto text-center p-8 shadow-xl">
        {loading ? (
          <div className="grid gap-4">
            <div className="flex justify-center">
              <H2HSkeleton width="100px" height="100px" className="rounded-full" />
            </div>
            <H2HSkeleton width="60%" height="20px" className="mx-auto" />
            <H2HSkeleton width="50%" height="16px" className="mx-auto" />
          </div>
        ) : err ? (
          <div className="text-left">
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {err}
            </div>
            <div className="mt-4 flex justify-center">
              <H2HButton variant="ghost" onClick={() => nav("/login")}>
                ไปหน้า Login
              </H2HButton>
            </div>
          </div>
        ) : (
          <>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 mx-auto rounded-full border-2 border-[var(--accent)] shadow-[0_0_20px_rgba(242,193,78,0.25)]"
            />
            <h2 className="text-2xl mt-4 font-semibold">{user.name}</h2>
            <p className="text-[var(--fg-muted)]">{user.email}</p>

            <div className="mt-2 flex justify-center gap-2">
              <H2HTag
                text={user.role}
                color={user.role === "Admin" ? "gold" : "blue"}
              />
              <H2HTag text={`BROC ${tokenBalance}`} color="gold" />
            </div>

            <p className="caption mt-3">
              Joined since {new Date(user.joined).toLocaleDateString()}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <H2HButton variant="gold" onClick={() => alert("Phase 1: ยังไม่เปิดแก้ไขโปรไฟล์")}>
                <span className="material-icons-round text-base">edit</span>
                Edit Profile
              </H2HButton>
              <H2HButton variant="ghost" onClick={handleLogout}>
                <span className="material-icons-round text-base">logout</span>
                Logout
              </H2HButton>
            </div>
          </>
        )}
      </H2HCard>
    </div>
  );
}
