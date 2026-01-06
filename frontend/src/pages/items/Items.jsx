// frontend/src/pages/items/Items.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";

// รองรับทั้ง http://localhost:4000 และ http://localhost:4000/api
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_ROOT = RAW_BASE.replace(/\/$/, "").replace(/\/api$/, "");

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function Items() {
  const query = useQuery();
  const q = query.get("q") || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
  }, [q]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">สินค้ามือสองทั้งหมด</h1>

        {loading && <p>กำลังโหลด...</p>}
        {err && <p className="text-red-600">{err}</p>}
        {!loading && !err && items.length === 0 && (
          <p className="text-slate-400">ยังไม่มีสินค้า</p>
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
