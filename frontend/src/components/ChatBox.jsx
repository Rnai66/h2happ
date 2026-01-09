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

  const itemPrice = Number(price) || 0;
  const price5 = Math.floor(itemPrice * 0.95);
  const price10 = Math.floor(itemPrice * 0.90);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

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
        if (!cancelled) setError(err.message || "เกิดข้อผิดพลาดในการโหลดแชต");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, threadId]);

  const chatDisabled = !token || !buyerId || !sellerId || !itemId || loading || sending;
  const orderDisabled = !token || !buyerId || !sellerId || !itemId || creatingOrder;

  async function ensureThread() {
    if (threadId) return threadId;
    const thread = await api.post("/chat/threads", { buyerId, sellerId, itemId });
    onThreadCreated?.(thread);
    return thread._id;
  }

  async function handleSend(e) {
    if (e?.preventDefault) e.preventDefault();
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
      const res = await api.post("/orders", { itemId, buyerId, sellerId, source: "chat" });
      const order = res.order || res.data?.order || res;
      nav(`/orders/${order._id}?from=chat`);
    } catch (err) {
      setError(err.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setCreatingOrder(false);
    }
  }

  function sendOffer(percent, amount) {
    setInput(`[ข้อเสนอราคา] ขอลด ${percent}% เหลือ ฿${amount.toLocaleString()}`);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
      {/* Quick Actions Bar */}
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex flex-wrap gap-2">
        {itemPrice > 0 && (
          <>
            <button
              type="button"
              onClick={() => sendOffer(5, price5)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
            >
              💰 ลด 5%
            </button>
            <button
              type="button"
              onClick={() => sendOffer(10, price10)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
            >
              💰 ลด 10%
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setInput("ขอรายละเอียดเพิ่มครับ")}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
        >
          📝 ขอข้อมูลเพิ่ม
        </button>
        <button
          type="button"
          onClick={() => setInput("ขอรูปเพิ่มเติมครับ")}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
        >
          📷 ขอรูปเพิ่ม
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-500 text-sm">เริ่มสนทนาได้เลย!</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === buyerId;
          return (
            <div key={m._id || m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe
                  ? "bg-emerald-500 text-white rounded-br-sm shadow-md"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
                  }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line break-words">
                  {m.text}
                </p>
                {m.createdAt && (
                  <p className={`text-[10px] mt-1.5 ${isMe ? "text-emerald-100" : "text-slate-400"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-4 bg-slate-100 border-t-2 border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatDisabled}
            placeholder="พิมพ์ข้อความที่นี่..."
            className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-900 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 shadow-sm"
          />
          <button
            type="submit"
            disabled={chatDisabled || !input.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
          >
            ส่ง
          </button>
        </form>
      </div>

      {/* Order Button */}
      <div className="p-3 pt-0">
        <button
          type="button"
          onClick={handleCreateOrderClick}
          disabled={orderDisabled}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-md transition-all"
        >
          {creatingOrder ? "⏳ กำลังสร้าง..." : "🛒 เปิดคำสั่งซื้อ"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
