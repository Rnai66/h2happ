import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();

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
        <div className="h2h-chat p-6 text-white/80">
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
                      border border-white/15 bg-black/40 backdrop-blur">

        {/* ===== Header ===== */}
        <div className="px-4 py-3 flex items-center gap-3
                        border-b border-white/15 bg-black/60">
          <Link to="/chat" className="text-white/80 hover:text-white">
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold truncate text-white">
              {title}
            </h1>
            {thread?.item?.title && (
              <p className="text-xs text-white/70 truncate">
                สินค้า: {thread.item.title}
              </p>
            )}
          </div>
        </div>

        {/* ===== Messages ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-white/60">
              ยังไม่มีข้อความ เริ่มทักได้เลย 🙂
            </p>
          )}

          {messages.map((m) => {
            const isMe =
              String(m.senderId) === String(thread?.buyerId) ||
              String(m.senderId) === String(thread?.sellerId);

            return (
              <div
                key={m._id || m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
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
                  {m.createdAt && (
                    <div className="chat-meta">
                      {new Date(m.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ===== Composer ===== */}
        <div className="p-3 flex items-center gap-2
                        border-t border-white/15 bg-black/60">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="พิมพ์ข้อความ…"
            className="flex-1 chat-input"
          />
          <Button onClick={send} disabled={sending || !text.trim()}>
            {sending ? "กำลังส่ง..." : "ส่ง"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
