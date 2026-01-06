// frontend/src/pages/items/NewItem.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function NewItem() {
  const nav = useNavigate();

  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    location: "",
    category: "",
    imageUrl: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // เช็คว่า login อยู่ไหม (มี token)
  useEffect(() => {
    const token = localStorage.getItem("h2h_token");
    setAuthed(!!token);
  }, []);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    const token = localStorage.getItem("h2h_token");
    if (!token) {
      setAuthed(false);
      setErr("กรุณาเข้าสู่ระบบก่อนลงขายสินค้า");
      return;
    }

    if (!form.title || !form.price) {
      setErr("กรุณากรอกชื่อสินค้าและราคาให้ครบ");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: form.title,
        price: Number(form.price),
        location: form.location,
        category: form.category,
        description: form.description,
        images: form.imageUrl ? [form.imageUrl] : [],
      };

      const item = await api("/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setOk("สร้างประกาศสำเร็จ!");
      // ไปหน้า detail สินค้า
      const id = item._id || item.id;
      if (id) {
        setTimeout(() => {
          nav(`/items/${id}`);
        }, 300);
      }
    } catch (e) {
      console.error("create item error:", e);
      setErr(e.message || "สร้างประกาศไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  // ถ้ายังไม่ได้ login
  if (!authed) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto p-4 space-y-3">
          <h1 className="text-lg font-semibold">ลงขายสินค้า</h1>
          <p className="text-sm text-slate-600">
            กรุณาเข้าสู่ระบบก่อน เพื่อเริ่มลงขายสินค้าใน H2H Thailand
          </p>
          <div className="flex gap-2">
            <Link
              to="/auth?tab=login"
              className="px-3 py-1.5 rounded-full border border-slate-300 text-sm hover:bg-slate-100"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/auth?tab=register"
              className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-5 md:p-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            ลงขายสินค้าใหม่
          </h1>
          <Link
            to="/items"
            className="text-xs text-blue-600 underline"
          >
            ← กลับหน้าสินค้าทั้งหมด
          </Link>
        </header>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-600">{ok}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ชื่อสินค้า"
            placeholder="เช่น iPhone 13 128GB สีฟ้า"
            value={form.title}
            onChange={handleChange("title")}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="ราคา (บาท)"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={handleChange("price")}
              required
            />
            <Input
              label="พื้นที่นัดรับ / จังหวัด"
              placeholder="เช่น อโศก, สุรินทร์"
              value={form.location}
              onChange={handleChange("location")}
            />
          </div>

          <Input
            label="หมวดหมู่"
            placeholder="เช่น มือถือ, คอมพิวเตอร์, เสื้อผ้า"
            value={form.category}
            onChange={handleChange("category")}
          />

          <div>
            <label className="block text-sm mb-1">ลิงก์รูปภาพหลัก</label>
            <input
              type="url"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="วาง URL รูป (เช่น จาก Cloudinary / Imgur)"
              value={form.imageUrl}
              onChange={handleChange("imageUrl")}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              เวอร์ชันถัดไปจะรองรับอัปโหลดรูปจากเครื่องโดยตรง
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">รายละเอียดสินค้า</label>
            <textarea
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="สภาพสินค้า, อายุการใช้งาน, อุปกรณ์ที่มีให้, เงื่อนไขการรับสินค้า ฯลฯ"
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={busy}
              className="w-full md:w-auto"
            >
              {busy ? "กำลังสร้างประกาศ…" : "สร้างประกาศ"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
