// frontend/src/pages/HomeListings.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Card from "../components/ui/Card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function HomeListings() {
  const query = useQuery();
  const nav = useNavigate();
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

        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "40");
        params.set("status", "active");
        if (q) params.set("q", q);

        const res = await fetch(`${API_BASE}/items?` + params.toString());
        if (!res.ok) throw new Error("โหลดรายการไม่สำเร็จ");
        const data = await res.json();

        const list = Array.isArray(data) ? data : data.items || [];
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr(e.message || "โหลดข้อมูลผิดพลาด");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>
              H2H Thailand สินค้าล่าสุด
            </h1>
            {q && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ผลการค้นหา: "{q}"
              </p>
            )}
          </div>
          <button
            onClick={() => nav("/sell")}
            className="h2h-btn px-4 py-2 rounded-xl text-sm font-medium shadow-silk active:scale-[.97] transition"
          >
            + ลงขายสินค้า
          </button>
        </header>

        {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}

        {!loading && !err && items.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ยังไม่มีสินค้าในระบบ ลองลงขายชิ้นแรกเลย!
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <Link key={item._id} to={`/items/${item._id}`} className="block">
              <Card>
                <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100 relative">
                  <img
                    src={item.images?.[0] || "https://picsum.photos/400"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h2 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--text-main)' }}>
                    {item.title}
                  </h2>
                  <p className="text-base font-bold" style={{ color: 'var(--text-accent)' }}>
                    ฿{Number(item.price || 0).toLocaleString("th-TH")}
                  </p>
                  {item.location && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      📍 {item.location}
                    </p>
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
