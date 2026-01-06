import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ChatBox({
  token,
  threadId,
  onThreadCreated,
  buyerId,
  sellerId,
  itemId,
  price,
  onCreateOrder,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const nav = useNavigate();

  // Calculate Offer Prices (5% and 10% off)
  const price5 = price ? Math.floor(price * 0.95) : 0;
  const price10 = price ? Math.floor(price * 0.90) : 0;

  /* scroll ลงล่างเมื่อมีข้อความ */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  /* โหลด messages */
  useEffect(() => {
    if (!token || !threadId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await api.get(`/chat/threads/${threadId}/messages`);
        const msgs = Array.isArray(data) ? data : data.messages || [];
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled)
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดแชต");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, threadId]);

  const chatDisabled =
    !token || !buyerId || !sellerId || !itemId || loading || sending;

  const orderDisabled =
    !token || !buyerId || !sellerId || !itemId || creatingOrder;

  async function ensureThread() {
    if (threadId) return threadId;
    const thread = await api.post("/chat/threads", {
      buyerId,
      sellerId,
      itemId,
    });
    onThreadCreated?.(thread);
    return thread._id;
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || chatDisabled) return;

    try {
      setSending(true);
      setError("");
      const tid = await ensureThread();
      const msg = await api.post(`/chat/threads/${tid}/messages`, {
        text: input.trim(),
        senderId: buyerId,
      });
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      setError(err.message || "ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  async function handleCreateOrderClick() {
    if (onCreateOrder) return onCreateOrder();
    try {
      setCreatingOrder(true);
      setError("");
      const res = await api.post("/orders", {
        itemId,
        buyerId,
        sellerId,
        source: "chat",
      });
      const order = res.order || res.data?.order || res;
      nav(`/orders/${order._id}?from=chat`);
    } catch (err) {
      setError(err.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <div className="h2h-chat space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
          แชตคุยกับผู้ขาย / ต่อรองราคา
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          ใช้แชตนี้สอบถามรายละเอียดและตกลงราคาก่อนสั่งซื้อ
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          "ลดได้อีกไหมครับ",
          "ขอรายละเอียดเพิ่ม",
        ].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setInput((p) => (p ? p + " " + t : t))}
            className="px-3 py-1 rounded-full border transition hover:opacity-80"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            {t}
          </button>
        ))}

        {/* Dynamic Offer Buttons */}
        {price > 0 && (
          <>
            <button
              type="button"
              onClick={() => setInput(`[ข้อเสนอราคา] ขอลด 5% เหลือ ฿${price5.toLocaleString()}`)}
              className="px-3 py-1 rounded-full bg-blue-600/60 text-white border border-blue-400/30 hover:bg-blue-600/80"
            >
              ลด 5% (฿{price5.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setInput(`[ข้อเสนอราคา] ขอลด 10% เหลือ ฿${price10.toLocaleString()}`)}
              className="px-3 py-1 rounded-full bg-blue-600/90 text-white border border-blue-400/50 hover:bg-blue-600"
            >
              ลด 10% (฿{price10.toLocaleString()})
            </button>
          </>
        )}
      </div>

      {/* Chat box */}
      <div className="h-64 rounded-2xl border flex flex-col overflow-hidden shadow-sm"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          {loading && (
            <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>กำลังโหลดแชต...</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>
              ยังไม่มีข้อความ เริ่มทักได้เลย 🙂
            </p>
          )}

          {messages.map((m) => {
            const isBuyer = m.senderId === buyerId;
            return (
              <div
                key={m._id || m.id}
                className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isBuyer
                      ? "chat-bubble-me rounded-br-sm"
                      : "chat-bubble-other rounded-bl-sm"
                  }
                >
                  <p className="whitespace-pre-line break-words">
                    {m.text}
                  </p>
                  <div className="chat-meta text-right">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="border-t px-3 py-3 flex items-center gap-2"
          style={{ background: 'var(--bg-frame)', borderColor: 'var(--border-color)' }}
        >
          <input
            type="text"
            className="flex-1 rounded-full text-sm px-4 py-2 border-2 outline-none transition shadow-inner"
            style={{
              background: 'var(--bg-main)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
            placeholder="พิมพ์ข้อความ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatDisabled}
          />
          <button
            type="submit"
            disabled={chatDisabled || !input.trim()}
            className="px-5 py-2 rounded-full text-sm font-semibold shadow-md active:scale-95 transition"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff'
            }}
          >
            ส่ง
          </button>
        </form>
      </div>

      {/* Create order */}
      <button
        type="button"
        onClick={handleCreateOrderClick}
        disabled={orderDisabled}
        className="w-full md:hidden h2h-btn"
      >
        {creatingOrder ? "กำลังสร้างคำสั่งซื้อ..." : "เปิดคำสั่งซื้อจากแชต"}
      </button>

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div >
  );
}
