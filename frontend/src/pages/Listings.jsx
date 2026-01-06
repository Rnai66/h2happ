import { useMemo, useState } from "react";
import MobileShell from "../layouts/MobileShell";
import ItemCard from "../components/ItemCard";

const mock = Array.from({ length: 12 }).map((_, i) => ({
  _id: String(i+1),
  title: `iPhone 13 128GB — สภาพดีมาก #${i+1}`,
  price: 12000 + i * 150,
  location: i % 2 ? "อโศก" : "พระราม 9",
  image: `https://picsum.photos/seed/h2h-${i}/700/700`,
  sellerName: i % 2 ? "Test Seller" : "H2H Store",
}));

export default function Listings() {
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mock;
    return mock.filter(x => x.title.toLowerCase().includes(s) || x.location.toLowerCase().includes(s));
  }, [q]);

  return (
    <MobileShell
      title="Listings"
      right={
        <button className="h2h-btn-ghost px-3 py-2 rounded-xl text-xs">
          Filter
        </button>
      }
    >
      <div className="mt-2">
        <div className="h2h-card rounded-2xl p-3 flex items-center gap-2">
          <span className="text-white/60">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h2h-input w-full rounded-xl px-3 py-2 text-sm"
            placeholder="ค้นหาสินค้า / พื้นที่..."
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map((it) => (
            <ItemCard
              key={it._id}
              item={it}
              onClick={() => console.log("open", it._id)}
            />
          ))}
        </div>

        <div className="mt-5 text-center text-xs text-white/50">
          © H2H Thailand — Blue×Gold Mobile UI Demo
        </div>
      </div>
    </MobileShell>
  );
}
