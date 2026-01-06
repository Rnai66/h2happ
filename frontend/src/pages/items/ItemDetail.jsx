// frontend/src/pages/items/ItemDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import ChatBox from "../../components/ChatBox";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext"; // ✅ Use Context

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, token, isAdmin } = useAuth(); // ✅ Get Admin status

  const [item, setItem] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

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

  async function handleDelete() {
    if (!window.confirm("ยืนยันการลบสินค้านี้?")) return;
    try {
      await api.delete(`/items/${item._id}`);
      nav("/items");
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลสินค้า...</div>
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
  const isOwner = user?._id === item.sellerId;
  const canManage = isOwner || isAdmin; // ✅ Admin override

  // 🧠 ฟังก์ชันหลัก: “เปิดคำสั่งซื้อจากแชต”
  async function handleCreateOrderFromChat() {
    try {
      setOrderError("");
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

      const payload = {
        itemId: item._id,
        buyerId,
        sellerId,
        amount: typeof item.price === "number" ? item.price : undefined,
        source: "chat",
        threadId: thread?._id,
      };

      const res = await api.post("/orders", payload);
      const order = res.order || res.data?.order || (res.ok && res.data) || res;
      const orderId = order?._id || order?.id;

      if (!orderId) throw new Error("เซิร์ฟเวอร์ไม่ส่ง orderId กลับมา");
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
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            {item.title} — <span style={{ color: 'var(--text-accent)' }}>฿{item.price?.toLocaleString("th-TH")}</span>
          </h1>

          {/* 🛠 Admin / Owner Tools */}
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => nav(`/sell?edit=${item._id}`)}
                className="h2h-btn-ghost text-xs px-3 py-1">
                แก้ไข
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transaction">
                ลบ
              </button>
              {isAdmin && !isOwner && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full self-center">Admin</span>}
            </div>
          )}
        </div>

        <p className="text-sm" style={{ color: 'var(--text-main)' }}>{item.description}</p>

        {/* ข้อมูลผู้ขายแบบละเอียด */}
        {/* ข้อมูลผู้ขายแบบละเอียด */}
        <div className="p-4 rounded-xl border text-sm space-y-3"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)'
          }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
            ข้อมูลผู้ขาย
          </h3>
          <div className="space-y-1.5">
            <p>
              <span className="font-semibold mr-2">ชื่อ:</span>
              <span style={{ color: 'var(--text-main)' }}>
                {item.seller?.name || item.sellerName || "ไม่ระบุ"}
              </span>
            </p>
            <p>
              <span className="font-semibold mr-2">อีเมล:</span>
              <span style={{ color: 'var(--text-main)' }}>
                {item.seller?.email || "ไม่ระบุ"}
              </span>
            </p>
            <p>
              <span className="font-semibold mr-2">เบอร์โทร:</span>
              <span style={{ color: 'var(--text-main)' }}>
                {item.seller?.phone || "ไม่ระบุ"}
              </span>
            </p>
          </div>

          {isAdmin && <p className="pt-2 text-[10px] opacity-70 border-t border-dashed border-white/10 mt-2">sellerId: {String(item.sellerId || "")}</p>}
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
          price={item.price}
          onCreateOrder={handleCreateOrderFromChat}
        />

        {/* ปุ่ม fallback */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleCreateOrderFromChat}
            disabled={creatingOrder || !token || !buyerId || !sellerId || !item._id}
            className="h2h-btn px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creatingOrder ? "กำลังสร้างคำสั่งซื้อ…" : "เปิดคำสั่งซื้อจากแชตนี้"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
