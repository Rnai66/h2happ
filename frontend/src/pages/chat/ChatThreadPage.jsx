import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
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
          nav(`/auth?tab=login&redirectTo=${encodeURIComponent(`/chat/${threadId}`)}`, { replace: true });
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
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (err || !thread) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😔</span>
            </div>
            <p className="text-red-600 mb-4">{err || "ไม่พบแชตนี้"}</p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              ← กลับหน้าแชต
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isBuyer = String(thread.buyerId) === String(user._id || user.id);
  const partnerName = thread?.partner?.name || (isBuyer ? "ผู้ขาย" : "ผู้ซื้อ");

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
          <Link
            to="/chat"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate text-lg">{partnerName}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-xs text-gray-500">ออนไลน์</span>
            </div>
          </div>
        </div>

        {/* Product Card */}
        {item && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 truncate">{item.title}</h2>
                <p className="text-xl font-bold text-orange-500 mt-1">
                  ฿{Number(item.price || 0).toLocaleString("th-TH")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📍 {item.location || "ยังไม่ระบุ"}
                </p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${isBuyer ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                  {isBuyer ? "🛒 ผู้ซื้อ" : "🏪 ผู้ขาย"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chat Box */}
        <div className="h-[450px]">
          <ChatBox
            token={isAuthenticated}
            threadId={threadId}
            buyerId={thread.buyerId}
            sellerId={thread.sellerId}
            itemId={thread.itemId}
            price={item?.price}
            onCreateOrder={handleCreateOrder}
          />
        </div>
      </div>
    </MainLayout>
  );
}
