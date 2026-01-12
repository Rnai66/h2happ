import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// import api from "../lib/api"; // <-- เดิมใช้ lib/api แต่เราจะใช้ api/index ที่แก้แล้วให้ชัวร์ หรือใช้ lib/api ก็ได้ถ้าแก้มันแล้ว
// แต่เพื่อความชัวร์ ใช้ api/index ดีกว่า หรือเช็คว่า lib/api แก้ยัง -> แก้แล้ว
// งั้นใช้ lib/api ต่อไป แต่ลบ hardcoded BASE ทิ้ง
import api from "../lib/api";
import { getToken } from "../lib/auth";

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [err, setErr] = useState("");
  const [ordersByItem, setOrdersByItem] = useState({});
  const lastLogRef = useRef("");

  // const BASE = ... (ลบออก)
  const tokenLen = (getToken() || "").length;

  function log(...args) {
    const line = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    lastLogRef.current = line.slice(0, 300);
    // eslint-disable-next-line no-console
    console.log("[ItemsPage]", ...args);
  }

  async function loadItems() {
    try {
      setLoadingItems(true);
      setErr("");
      log("GET /api/items start");
      const res = await api("/api/items?page=1&limit=20");
      log("GET /api/items ok:", res);
      const rows =
        (Array.isArray(res) && res) ||
        res?.items ||
        res?.data?.items ||
        [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      log("GET /api/items fail:", e?.message);
      setErr(e?.message || "Load items failed");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  async function createOrder(it) {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    try {
      const itemId = it._id || it.id;
      const sellerId =
        it.sellerId || it?.seller?._id || it.ownerId || it.userId || "6748aaaa0000000000000002";
      const price = Number(it.price ?? it.amount ?? 0) || 12000;

      log("POST /api/orders", { itemId, sellerId, price });
      const res = await api("/api/orders", {
        method: "POST",
        body: { itemId, sellerId, price, method: "bank_transfer" },
      });
      log("POST /api/orders ok:", res);
      setOrdersByItem((prev) => ({ ...prev, [itemId]: res }));
    } catch (e) {
      log("POST /api/orders fail:", e?.message);
      alert("เริ่มออเดอร์ไม่สำเร็จ: " + (e.message || "unknown error"));
    }
  }

  async function uploadSlip(itemId, file) {
    if (!file) return;
    if (!getToken()) {
      navigate("/login");
      return;
    }
    try {
      const order = ordersByItem[itemId];
      if (!order?._id) {
        alert("ยังไม่มีออเดอร์ของสินค้านี้");
        return;
      }
      const fd = new FormData();
      fd.append("slip", file);

      log("POST /api/orders/:id/slip", { orderId: order._id, file: file.name, size: file.size });
      const res = await api(`/api/orders/${order._id}/slip`, {
        method: "POST",
        body: fd,
        isForm: true,
      });
      log("POST /api/orders/:id/slip ok:", res);
      setOrdersByItem((prev) => ({ ...prev, [itemId]: res }));
    } catch (e) {
      log("POST /api/orders/:id/slip fail:", e?.message);
      alert("อัปโหลดสลิปไม่สำเร็จ: " + (e.message || "unknown error"));
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="space-y-4">
      {/* Debug panel (ถ้ารบกวนตา คอมเมนต์ทิ้งได้) */}
      <div className="text-xs p-2 rounded-lg bg-black/80 text-white border border-white/10">
        <div>BASE: <code>{BASE}</code></div>
        <div>Token length: {tokenLen} {tokenLen ? "(signed in)" : "(not signed in)"}</div>
        <div>Loading: {String(loadingItems)} | Items: {items.length}</div>
        {err && <div className="text-amber-300">Error: {err}</div>}
        {lastLogRef.current && <div className="text-white/70">Last: {lastLogRef.current}</div>}
        <div className="mt-1 flex gap-2">
          <button onClick={loadItems} className="px-2 py-1 rounded bg-white/10">Reload</button>
          {!tokenLen && (
            <button onClick={() => navigate("/login")} className="px-2 py-1 rounded bg-white/10">
              ไปหน้า Login
            </button>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold title-glow mb-2">รายการสินค้า</h1>

      {loadingItems && (
        <div className="text-[var(--text-muted)]">กำลังโหลดรายการสินค้า...</div>
      )}

      {!loadingItems && items.length === 0 && (
        <div className="space-y-2">
          <div className="text-[var(--text-muted)]">ยังไม่มีสินค้า</div>
          {/* ปุ่ม mock เผื่อทดสอบ flow ออเดอร์เร็วๆ */}
          <button
            className="px-3 py-2 rounded-2xl bg-blue-700 text-white"
            onClick={async () => {
              // mock item เพื่อเทสฟลว์ทันที
              const fake = { _id: "6748bbbb0000000000000001", price: 12000, sellerId: "6748aaaa0000000000000002", title: "Mock Item" };
              await createOrder(fake);
              setItems([fake]); // ให้มีการ์ดขึ้นมาอัปสลิปได้
            }}
          >
            ทดสอบสร้างออเดอร์ (mock)
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => {
          const itemId = it._id || it.id || `it-${Math.random().toString(36).slice(2)}`;
          const order = ordersByItem[itemId];
          const status = order?.status;

          return (
            <div key={itemId} className="h2h-card p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-xl bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center">
                  {it.images?.[0] ? (
                    <img src={it.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-[var(--text-muted)]">inventory_2</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-[var(--text-main)]">{it.title || it.name || "Untitled"}</div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm text-[var(--text-accent)] font-medium">
                      ฿ {Number(it.price ?? it.amount ?? 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      โดย {it?.seller?.name || it?.sellerName || it?.sellerId || "ไม่ระบุ"} ({it?.seller?.email || "-"})
                    </span>
                  </div>
                </div>
              </div>

              {!order && (
                <button
                  onClick={() => createOrder(it)}
                  className="px-4 py-2 rounded-2xl bg-blue-700 text-white"
                >
                  เริ่มออเดอร์
                </button>
              )}

              {order && (
                <div className="rounded-xl border border-[var(--glass-border)] p-3 bg-black/5 dark:bg-white/5 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 dark:bg-blue-100/10 dark:text-blue-200">
                      สถานะ: {status}
                    </span>
                    {order?._id && (
                      <span className="text-xs text-[var(--text-muted)]">Order ID: {order._id}</span>
                    )}
                    {order?.slip?.url && (
                      <a href={order.slip.url} target="_blank" rel="noreferrer" className="text-sm underline text-[var(--text-main)]">
                        ดูสลิป
                      </a>
                    )}
                  </div>

                  {status === "PENDING_PAYMENT" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => uploadSlip(itemId, e.target.files?.[0] || null)}
                      />
                      <span className="text-xs text-[var(--text-muted)]">แนบสลิปเพื่อยืนยันการชำระ</span>
                    </div>
                  )}

                  {status === "PAID_PENDING_VERIFY" && (
                    <div className="text-sm text-amber-600 dark:text-amber-300">อัปสลิปแล้ว — รอผู้ขายยืนยันการชำระเงิน</div>
                  )}
                  {status === "PAID_VERIFIED" && (
                    <div className="text-sm text-emerald-600 dark:text-emerald-300">ผู้ขายยืนยันแล้ว — ผู้ซื้อสามารถกด Complete ได้จากหน้าออเดอร์</div>
                  )}
                  {status === "COMPLETED" && (
                    <div className="text-sm text-emerald-600 dark:text-emerald-300">คำสั่งซื้อเสร็จสมบูรณ์ 🎉</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
