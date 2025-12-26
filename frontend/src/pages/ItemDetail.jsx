// frontend/src/components/ChatBox.jsx
import { useEffect, useState, useRef } from "react";

const API_BASE = "http://localhost:4000/api";

/**
 * ChatBox สำหรับคุย/ต่อรองราคา
 *
 * Props:
 * - token: JWT ของฝั่งที่ใช้แชต (ตอนนี้ใช้ buyer เป็นหลัก)
 * - threadId: _id ของแชตเดิม (ถ้ามี)
 * - onThreadCreated: callback(thread) เมื่อสร้างแชตใหม่สำเร็จ
 * - buyerId, sellerId, itemId: อ้างอิงคู่สนทนา + สินค้าที่คุยอยู่
 */
export default function ChatBox({
  token,
  threadId,
  onThreadCreated,
  buyerId,
  sellerId,
  itemId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  // เลื่อน scroll ไปล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  // โหลด messages ถ้ามี threadId แล้ว
  useEffect(() => {
    if (!token || !threadId) return;

    let cancelled = false;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/chat/threads/${threadId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "โหลดแชตไม่สำเร็จ");
        }

        if (!cancelled) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("loadMessages error:", err);
        if (!cancelled) setError(err.message || "เกิดข้อผิดพลาดในการโหลดแชต");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMessages();

    // (ถ้าจะทำ auto-poll ทุก X วิ ค่อยมาเพิ่ม setInterval ตรงนี้)
    return () => {
      cancelled = true;
    };
  }, [token, threadId]);

  const disabled =
    !token || !buyerId || !sellerId || !itemId || loading || sending;

  async function ensureThread() {
    // ถ้ามี thread แล้วก็ใช้ตัวเดิมเลย
    if (threadId) return threadId;

    // สร้าง thread ใหม่
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyerId,
        sellerId,
        itemId,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.message || "สร้างแชตไม่สำเร็จ");
    }

    if (onThreadCreated) {
      onThreadCreated(data.thread);
    }

    return data.thread._id;
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    try {
      setSending(true);
      setError("");

      const thread = await ensureThread();

      const res = await fetch(
        `${API_BASE}/chat/threads/${thread}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: input.trim(),
            senderId: buyerId, // ตอนนี้ฝั่งนี้คือ buyer
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "ส่งข้อความไม่สำเร็จ");
      }

      setMessages((prev) => [...prev, data.message]);
      setInput("");
    } catch (err) {
      console.error("sendMessage error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setSending(false);
    }
  }

  /** ปุ่มคำพูดลัด สำหรับต่อรองราคาง่าย ๆ */
  function quickText(text) {
    setInput((prev) => (prev ? prev + " " + text : text));
  }

  /** เสนอราคาด้วยข้อความ (เช่น [OFFER] ขอเสนอราคา ฿10,500) */
  function proposePrice(amount) {
    const formatted = `[ข้อเสนอราคา] ขอเสนอราคา ฿${Number(
      amount
    ).toLocaleString("th-TH")}`;
    setInput(formatted);
  }

  return (
    <div className="space-y-3">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-slate-900">
          แชตคุยกับผู้ขาย / ต่อรองราคา
        </h3>
        <p className="text-xs text-slate-500">
          ใช้แชตนี้ถามรายละเอียดสินค้า หรือต่อรองราคาให้ลงตัวก่อนกดสั่งซื้อได้เลย
        </p>
      </div>

      {/* แถบคำพูดลัด / ต่อรองเร็ว */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => quickText("ลดได้อีกไหมครับ")}
          className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          ลดได้อีกไหมครับ
        </button>
        <button
          type="button"
          onClick={() => quickText("รับที่ 10,000 บาทได้ไหมครับ")}
          className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          รับที่ 10,000 ได้ไหม
        </button>
        <button
          type="button"
          onClick={() => quickText("ขอรายละเอียดสภาพเครื่องเพิ่มเติมหน่อยครับ")}
          className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          ขอรายละเอียดเพิ่ม
        </button>
        <button
          type="button"
          onClick={() => proposePrice(10500)}
          className="px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          เสนอราคา ฿10,500
        </button>
      </div>

      {/* กล่องข้อความแชต */}
      <div className="h-64 border rounded-2xl bg-slate-50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          {loading && (
            <p className="text-slate-400">กำลังโหลดประวัติแชต...</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-slate-400">
              ยังไม่มีข้อความ เริ่มทักไปหาผู้ขายเพื่อต่อรองราคาก่อนได้เลย 🙂
            </p>
          )}

          {messages.map((m) => {
            const isBuyer = m.senderId === buyerId;
            return (
              <div
                key={m._id || m.id}
                className={`flex ${
                  isBuyer ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-snug ${
                    isBuyer
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <p className="mt-1 text-[10px] opacity-70 text-right">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ช่องพิมพ์ข้อความ */}
        <form
          onSubmit={handleSend}
          className="border-t bg-white px-2 py-1 flex items-center gap-2"
        >
          <input
            type="text"
            className="flex-1 text-xs px-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="พิมพ์ข้อความต่อลองราคา หรือถามข้อมูลสินค้าเพิ่มเติม..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="px-3 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            ส่ง
          </button>
        </form>
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
