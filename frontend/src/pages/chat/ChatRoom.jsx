import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const bottomRef = useRef(null);

  // โหลดห้อง + ข้อความ
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const data = await api.get("/chat/threads/mine");
        const list = Array.isArray(data) ? data : data.threads || [];
        const t = list.find((th) => String(th._id) === String(id));

        if (!t) {
          if (!cancelled) setErr("ไม่พบห้องแชตนี้");
          return;
        }
        if (!cancelled) setThread(t);

        const msgsRes = await api.get(`/chat/threads/${id}/messages`);
        const msgs = Array.isArray(msgsRes)
          ? msgsRes
          : msgsRes.messages || [];

        if (!cancelled) setMessages(msgs);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("โหลดห้องแชตไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // scroll ลงล่าง
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim() || sending) return;
    try {
      setSending(true);
      const msg = await api.post(`/chat/threads/${id}/messages`, {
        text: text.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (e) {
      console.error(e);
      setErr("ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  /* ===== States ===== */
  if (loading && !thread && !err) {
    return (
      <MainLayout>
        <div className="h2h-chat p-6 text-[var(--text-muted)]">
          กำลังโหลดห้องแชต...
        </div>
      </MainLayout>
    );
  }

  if (err && !thread) {
    return (
      <MainLayout>
        <div className="h2h-chat max-w-md mx-auto p-6 space-y-4">
          <p className="text-red-300">{err}</p>
          <Button onClick={() => nav("/chat")}>
            ← กลับไปหน้าแชต
          </Button>
        </div>
      </MainLayout>
    );
  }

  const title =
    thread?.partner?.name ||
    thread?.item?.title ||
    "ห้องแชต";

  return (
    <MainLayout>
      <div className="h2h-chat max-w-3xl mx-auto h-[calc(100dvh-220px)] md:h-[720px]
                      flex flex-col rounded-2xl overflow-hidden
                      border border-[var(--glass-border)] h2h-card">

        {/* ===== Header ===== */}
        <div className="px-4 py-3 flex items-center gap-3
                        border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Link to="/chat" className="text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold">
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold truncate text-gray-800 dark:text-gray-100 text-lg">
              {title}
            </h1>
            {thread?.item?.title && (
              <p className="text-sm text-gray-800 dark:text-gray-300 truncate font-medium">
                สินค้า: {thread.item.title}
              </p>
            )}
          </div>
        </div>

        {/* ===== Messages ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-800">
          {messages.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ยังไม่มีข้อความ เริ่มทักได้เลย 🙂
            </p>
          )}

          {messages.map((m) => {
            const isMe = String(m.senderId) === String(user?._id);
            const partnerAvatar = thread?.partner?.avatar;

            return (
              <div
                key={m._id || m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}
              >
                {!isMe && (
                  partnerAvatar ? (
                    <img src={partnerAvatar} alt="Partner" className="w-8 h-8 rounded-full object-cover mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold mt-1">
                      {thread?.partner?.name?.charAt(0) || "?"}
                    </div>
                  )
                )}
                <div
                  className={
                    isMe
                      ? "chat-bubble-me"
                      : "chat-bubble-other"
                  }
                >
                  <p className="whitespace-pre-line break-words">
                    {m.text}
                  </p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {isMe && (
                  user?.avatar ? (
                    <img src={user.avatar} alt="Me" className="w-8 h-8 rounded-full object-cover mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mt-1">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )
                )}
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ===== Composer ===== */}
        <div className="p-3 flex items-center gap-2
                        border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="พิมพ์ข้อความ…"
            className="flex-1 px-4 py-3 rounded-full text-sm text-slate-900 dark:text-gray-100 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-5 py-3 rounded-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {sending ? "..." : "ส่ง"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
