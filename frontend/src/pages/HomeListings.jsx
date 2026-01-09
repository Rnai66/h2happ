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
            <h1 className="text-xl font-semibold text-[var(--text-main)]">
              H2H Thailand  สินค้าล่าสุด
            </h1>
            {q && (
              <p className="text-xs text-[var(--text-muted)]">
                ผลการค้นหา: "{q}"
              </p>
            )}
          </div>
          <button
            onClick={() => nav("/sell")}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white
                       bg-gradient-to-r from-[#2563EB] to-[#D4AF37]
                       hover:from-[#1D4ED8] hover:to-[#facc15]
                       shadow-silk active:scale-[.97] transition"
          >
            + ลงขายสินค้า
          </button>
        </header>

        {loading && <p className="text-sm text-[var(--text-muted)]">กำลังโหลด...</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}

        {!loading && !err && items.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">
            ยังไม่มีสินค้าในระบบ ลองลงขายชิ้นแรกเลย!
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <Link key={item._id} to={`/items/${item._id}`} className="block">
              <Card className="h2h-card border-none hover:shadow-lg transition-all duration-300">
                <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-black/5 dark:bg-white/10 relative">
                  <img
                    src={item.images?.[0] || "https://placehold.co/400x300?text=No+Image"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h2 className="text-sm font-semibold line-clamp-2 text-[var(--text-main)]">
                    {item.title}
                  </h2>
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="text-base font-bold text-[var(--text-accent)]">
                      ฿{Number(item.price || 0).toLocaleString("th-TH")}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-[60%]">
                      {item.seller?.name || item.sellerName || "ไม่ระบุ"} <br />
                      <span className="text-[10px] opacity-75">{item.seller?.email}</span>
                    </p>
                  </div>
                  {item.location && (
                    <p className="text-xs text-[var(--text-muted)]">
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
