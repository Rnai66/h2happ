import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";

export default function ChatList() {
  const nav = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      nav(`/auth?tab=login&redirectTo=${encodeURIComponent("/chat")}`);
      return;
    }

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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">💬 แชตของฉัน</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">การสนทนาทั้งหมดของคุณ</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{err}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !err && threads.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">ยังไม่มีแชต</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">เริ่มสนทนากับผู้ขายจากหน้าสินค้าได้เลย</p>
            <Link
              to="/items"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              🛍️ ดูสินค้า
            </Link>
          </div>
        )}

        {/* Chat List */}
        {!loading && !err && threads.length > 0 && (
          <div className="space-y-3">
            {threads.map((t, index) => {
              const last = t.lastMessage?.text || "ยังไม่มีข้อความ";
              const ts = t.lastMessage?.createdAt
                ? new Date(t.lastMessage.createdAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "";

              const partnerName = t.partner?.name || "คู่สนทนา";
              const item = t.item?.title || "สินค้า";
              const initial = partnerName.charAt(0).toUpperCase();

              // Random color for avatar based on index
              const colors = [
                "bg-blue-500", "bg-emerald-500", "bg-purple-500",
                "bg-orange-500", "bg-pink-500", "bg-teal-500"
              ];
              const avatarColor = colors[index % colors.length];

              return (
                <Link key={t._id} to={`/chat/${t._id}`} className="block">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg border border-gray-100 dark:border-slate-700 p-4 transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      {/* {console.log("Thread:", t.partner)} */}
                      {t.partner?.avatar ? (
                        <img
                          src={t.partner.avatar}
                          alt={partnerName}
                          className="w-14 h-14 rounded-full object-cover shadow-md border border-gray-100 dark:border-slate-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white text-xl font-bold shadow-md ${t.partner?.avatar ? "hidden" : ""}`}>
                        {initial}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-lg">
                            {partnerName}
                          </h3>
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            {ts}
                          </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 truncate mt-1 font-medium">
                          {last}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center gap-1">
                          📦 {item}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-300 dark:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
