// frontend/src/pages/items/Items.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";

// รองรับทั้ง http://localhost:4000 และ http://localhost:4000/api
import { Capacitor } from "@capacitor/core";

// รองรับทั้ง http://localhost:4000 และ http://localhost:4000/api
let RAW_BASE = import.meta.env.VITE_API_BASE || "http://10.0.2.2:4010";

if (Capacitor.isNativePlatform()) {
  RAW_BASE = "http://10.0.2.2:4010";
}

const API_ROOT = RAW_BASE.replace(/\/$/, "").replace(/\/api$/, "");

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function Items() {
  const { user } = useAuth();
  const query = useQuery();
  const q = query.get("q") || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showMyItems, setShowMyItems] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");

        const params = new URLSearchParams({
          page: "1",
          limit: "40",
          status: "active",
        });
        if (q) params.set("q", q);

        // Filter by My Items
        if (showMyItems && user?._id) {
          params.set("sellerId", user._id);
        }

        const res = await fetch(`${API_ROOT}/api/items?` + params.toString());
        if (!res.ok) throw new Error("โหลดรายการไม่สำเร็จ");

        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.items || data.data?.items || [];

        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, [q, showMyItems, user]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">สินค้ามือสองทั้งหมด</h1>

          {/* Toggle Filter */}
          {user && (
            <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors select-none">
              <input
                type="checkbox"
                checked={showMyItems}
                onChange={(e) => setShowMyItems(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">แสดงเฉพาะสินค้าของฉัน</span>
            </label>
          )}
        </div>

        {loading && <p>กำลังโหลด...</p>}
        {err && <p className="text-red-600">{err}</p>}
        {!loading && !err && items.length === 0 && (
          <p className="text-slate-400">ยังไม่มีสินค้า {showMyItems ? "ของคุณ" : ""}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <Link key={item._id} to={`/items/${item._id}`}>
              <Card>
                <div className="aspect-square bg-slate-100 rounded-t-xl overflow-hidden">
                  <img
                    src={
                      item.images?.[0] ||
                      item.imageUrl ||
                      item.image ||
                      "https://picsum.photos/400"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h2 className="text-sm font-semibold line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-base font-bold text-blue-700">
                    ฿{Number(item.price).toLocaleString("th-TH")}
                  </p>
                  <p className="text-xs text-slate-500">
                    เหลือ {item.quantity ?? 1} ชิ้น
                  </p>
                  {item.location && (
                    <p className="text-xs text-slacdte-500">📍 {item.location}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
