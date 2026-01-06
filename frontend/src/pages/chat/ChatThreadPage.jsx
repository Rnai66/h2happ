import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";
import ChatBox from "../../components/ChatBox";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function ChatThreadPage() {
  const { threadId } = useParams();
  const nav = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [thread, setThread] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (!isAuthenticated || !user) {
          nav(
            `/auth?tab=login&redirectTo=${encodeURIComponent(
              `/chat/${threadId}`
            )}`,
            { replace: true }
          );
          return;
        }

        const t = await api.get(`/chat/threads/${threadId}`);
        setThread(t);

        if (t.itemId) {
          const it = await api.get(`/items/${t.itemId}`);
          setItem(it);
        }
      } catch (e) {
        console.error("load chat thread error:", e);
        setErr(e.message || "โหลดข้อมูลแชตไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId, isAuthenticated, user, nav]);

  async function handleCreateOrder() {
    try {
      if (!user || !thread || !item) return;

      const buyerId = thread.buyerId;
      const sellerId = thread.sellerId;
      const myId = user._id || user.id;

      if (String(buyerId) !== String(myId)) {
        alert("เฉพาะผู้ซื้อเท่านั้นที่เปิดคำสั่งซื้อได้");
        return;
      }

      const payload = {
        itemId: item._id,
        buyerId,
        sellerId,
        amount: item.price,
        chatThreadId: thread._id,
        itemSnapshot: {
          title: item.title,
          price: item.price,
          images: item.images || [],
          location: item.location || "",
        },
      };

      const res = await api.post("/orders", payload);
      const order = res.order || res;
      nav(`/orders/${order._id}`);
    } catch (e) {
      console.error(e);
      alert("สร้างคำสั่งซื้อไม่สำเร็จ");
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="h2h-chat max-w-3xl mx-auto p-6 text-white/80">
          กำลังโหลดแชต...
        </div>
      </MainLayout>
    );
  }

  if (err || !thread) {
    return (
      <MainLayout>
        <div className="h2h-chat max-w-3xl mx-auto p-6 text-red-300">
          โหลดแชตไม่สำเร็จ: {err || "ไม่พบแชตนี้"}
        </div>
      </MainLayout>
    );
  }

  const isBuyer = String(thread.buyerId) === String(user._id || user.id);

  return (
    <MainLayout>
      <div className="h2h-chat max-w-3xl mx-auto space-y-4">
        {/* ===== Header: Item Info ===== */}
        {item && (
          <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="p-4 flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0
                              grid place-content-center border"
                style={{ background: 'var(--bg-frame)', borderColor: 'var(--border-color)' }}>
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl" style={{ opacity: 0.6 }}>📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                  {item.title}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-accent)' }}>
                  ฿{Number(item.price || 0).toLocaleString("th-TH")}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {item.location || "ยังไม่ระบุสถานที่นัดรับ"}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  คุณเป็น{" "}
                  <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                    {isBuyer ? "ผู้ซื้อ" : "ผู้ขาย"}
                  </span>{" "}
                  ในดีลนี้
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ===== Chat Box ===== */}
        <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-4">
            <ChatBox
              token={isAuthenticated}
              threadId={threadId}
              buyerId={thread.buyerId}
              sellerId={thread.sellerId}
              itemId={thread.itemId}
              price={item?.price} // Pass price for offer calculations
              onCreateOrder={handleCreateOrder}
            />
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
