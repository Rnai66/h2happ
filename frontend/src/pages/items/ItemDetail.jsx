// frontend/src/pages/items/ItemDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import ChatBox from "../../components/ChatBox";
import { api } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // สำหรับสร้างคำสั่งซื้อจากแชต
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const token = getToken();
  const user = getUser(); // buyer ปัจจุบัน

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api.get(`/items/${id}`);
        setItem(data);
      } catch (e) {
        console.error("load item error:", e);
        setError(e.message || "ไม่พบสินค้า หรือมีข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 text-sm">กำลังโหลดข้อมูลสินค้า...</div>
      </MainLayout>
    );
  }

  if (error || !item) {
    return (
      <MainLayout>
        <div className="p-4 text-sm text-red-600">
          ไม่พบสินค้า หรือมีข้อผิดพลาด: {error || "Unknown error"}
        </div>
      </MainLayout>
    );
  }

  const buyerId = user?._id;
  const sellerId = item.sellerId;

  // 🧠 ฟังก์ชันหลัก: “เปิดคำสั่งซื้อจากแชต”
  async function handleCreateOrderFromChat() {
    try {
      setOrderError("");

      // ถ้ายังไม่ล็อกอิน → ส่งไปหน้า login ก่อน แล้วเดี๋ยวกลับมาหน้านี้
      if (!token || !buyerId) {
        nav(
          `/auth?tab=login&redirectTo=${encodeURIComponent(`/items/${item._id}`)}`
        );
        return;
      }

      if (!sellerId) {
        setOrderError("ไม่พบผู้ขายของสินค้านี้ (sellerId)");
        return;
      }

      setCreatingOrder(true);

      // เตรียม payload สำหรับ backend
      const payload = {
        itemId: item._id,
        buyerId,
        sellerId,
        amount:
          typeof item.price === "number"
            ? item.price
            : undefined, // ถ้าราคาเป็น number → ใส่ให้ด้วย
        source: "chat",
        threadId: thread?._id, // ถ้ามี thread แล้ว ก็ส่งไปเผื่อ backend เก็บ
      };

      console.log("[Chat→Order] create payload:", payload);

      const res = await api.post("/orders", payload);

      // รองรับหลายรูปแบบ response
      const order =
        res.order || res.data?.order || (res.ok && res.data) || res;

      const orderId = order?._id || order?.id;
      if (!orderId) {
        throw new Error("เซิร์ฟเวอร์ไม่ส่ง orderId กลับมา");
      }

      console.log("[Chat→Order] created:", order);

      // ✅ redirect ไปหน้า order detail
      nav(`/orders/${orderId}?from=chat&item=${item._id}`, { replace: false });
    } catch (e) {
      console.error("create order from chat error:", e);
      setOrderError(e.message || "สร้างคำสั่งซื้อจากแชตไม่สำเร็จ");
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* หัวข้อ + ราคา */}
        <h1 className="text-2xl font-bold text-blue-700">
          {item.title} — ฿{item.price?.toLocaleString("th-TH")}
        </h1>

        <p className="text-sm text-slate-700">{item.description}</p>

        {/* ข้อมูลผู้ขายแบบง่าย */}
        <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
          <p>
            ผู้ขาย:{" "}
            <span className="font-semibold text-slate-900">
              {item.sellerName || "ไม่ระบุ"}
            </span>
          </p>
          <p>sellerId: {String(item.sellerId || "")}</p>
        </div>

        {/* แจ้ง error กรณีสร้าง order ไม่สำเร็จ */}
        {orderError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {orderError}
          </div>
        )}

        {/* กล่องแชตต่อรองราคา + ปุ่มเปิดคำสั่งซื้อ */}
        <ChatBox
          token={token}
          threadId={thread?._id}
          onThreadCreated={setThread}
          buyerId={buyerId}
          sellerId={sellerId}
          itemId={item._id}
          onCreateOrder={handleCreateOrderFromChat}
        />

        {/* ปุ่ม fallback (เผื่ออยากให้มี "เปิดคำสั่งซื้อ" แยกด้านล่างอีกปุ่ม) */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleCreateOrderFromChat}
            disabled={
              creatingOrder || !token || !buyerId || !sellerId || !item._id
            }
            className="px-4 py-2 rounded-xl text-sm font-semibold
                       bg-emerald-600 text-white hover:bg-emerald-700
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creatingOrder ? "กำลังสร้างคำสั่งซื้อ…" : "เปิดคำสั่งซื้อจากแชตนี้"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
