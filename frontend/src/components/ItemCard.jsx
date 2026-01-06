export default function ItemCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full h2h-card rounded-2xl overflow-hidden active:scale-[0.99] transition"
    >
      <div className="relative">
        <img
          src={item.image}
          alt={item.title}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="h2h-chip px-2 py-1 rounded-lg text-[11px]">
            {item.location}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 rounded-lg text-[11px] bg-black/45 border border-white/10">
            ⭐ {item.rating ?? "4.8"}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="font-semibold text-sm leading-snug line-clamp-2">
          {item.title}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-base font-bold">
            ฿ {Number(item.price).toLocaleString("th-TH")}
          </div>
          <div className="text-[11px] text-white/60">
            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("th-TH") : "วันนี้"}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-white/70">ผู้ขาย</span>
          <span className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            {item.sellerName ?? "Seller"}
          </span>
          <span className="ml-auto text-[11px] text-white/60">ตอบไว</span>
        </div>
      </div>
    </button>
  );
}
