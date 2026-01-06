// frontend/src/pages/items/ItemDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api"; // แก้ path ตามของโปรเจกต์คุณ

function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await api.items.getOne(id); // เดี๋ยวไปเพิ่มฟังก์ชันนี้ใน api.js
        // สมมติ backend ส่ง { item: {...} }
        setItem(res.item);
      } catch (err) {
        console.error("load item detail error:", err);
        setError("ไม่พบสินค้า หรือมีข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="p-4">กำลังโหลดข้อมูลสินค้า...</div>;
  }

  if (error || !item) {
    return (
      <div className="p-4">
        <p className="mb-2 text-red-600">{error || "ไม่พบสินค้า"}</p>
        <Link to="/items" className="text-blue-600 underline">
          ← กลับไปหน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Link to="/items" className="text-blue-600 underline text-sm">
        ← กลับไปหน้ารายการสินค้า
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <img
            src={item.imageUrl || item.image || "https://via.placeholder.com/600"}
            alt={item.title}
            className="w-full aspect-square object-cover rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">{item.title}</h1>
          <p className="text-2xl font-semibold text-emerald-700 mb-2">
            ฿ {item.price}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            สถานที่: {item.location || "-"}
          </p>
          <p className="mb-4 whitespace-pre-line">
            {item.description || "ยังไม่มีรายละเอียดสินค้า"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailPage;
