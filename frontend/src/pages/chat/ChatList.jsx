import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function ChatList() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to finish
    if (!user) {
      nav(`/auth?tab=login&redirectTo=${encodeURIComponent("/chat")}`);
    }
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!user) return; // Wait for user

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await api.get(`/chat/threads/mine?ts=${Date.now()}`);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.threads)
            ? data.threads
            : [];
        setThreads(list);
      } catch (e) {
        setErr(e.message || "โหลดรายการแชตไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  return (
    <MainLayout>
      {/* 🔑 ครอบด้วย h2h-chat */}
      <div className="h2h-chat">

        {/* ===== Title ===== */}
        <div className="h2h-titlebar">
          <h1 className="h2h-title" style={{ color: 'var(--text-main)' }}>แชตของ {user?.name || "ฉัน"}</h1>
          <p className="h2h-subtitle" style={{ color: 'var(--text-muted)' }}>รายการสนทนาล่าสุด</p>
        </div>

        {loading && (
          <p className="text-sm text-white/70">กำลังโหลดแชต...</p>
        )}

        {err && (
          <p className="text-sm text-red-300">{err}</p>
        )}

        {!loading && !err && threads.length === 0 && (
          <p className="text-white/70">
            ยังไม่มีแชต ลองทักผู้ขายจากหน้าสินค้าดูนะครับ 🙂
          </p>
        )}

        {!loading && !err && threads.length > 0 && (
          <div className="space-y-3">
            {threads.map((t) => {
              const last = t.lastMessage?.text || "ยังไม่มีข้อความ";
              const ts = t.lastMessage?.createdAt
                ? new Date(t.lastMessage.createdAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "";

              const partnerName = t.partner?.name || "คู่สนทนา";
              const item = t.item?.title || "สินค้าชิ้นหนึ่ง";

              return (
                <Link key={t._id} to={`/chat/${t._id}`} className="block">
                  <Card className="h2h-card transition active:scale-[0.99]"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <div className="p-4 flex items-center gap-3">

                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full border
                                   grid place-content-center text-lg shadow-sm"
                        style={{
                          backgroundColor: 'var(--bg-frame)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-accent)'
                        }}
                      >
                        💬
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-3">
                          <p className="font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                            {partnerName}
                          </p>
                          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {ts}
                          </span>
                        </div>

                        <p className="text-sm truncate" style={{ color: 'var(--text-main)' }}>
                          {last}
                        </p>

                        <p className="text-xs truncate mt-1" style={{ color: 'var(--text-muted)' }}>
                          สินค้า: {item}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
