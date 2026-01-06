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

    setBusy(true);
    try {
      const payload = {
        title: form.title,
        price: Number(form.price),
        location: form.location,
        description: form.description,
        category: form.category,
        images: form.imageUrl ? [form.imageUrl] : [],
      };

      const item = await api.post("/items", payload);

      setOk("สร้างประกาศสำเร็จ!");
      const id = item._id;
      if (id) {
        setTimeout(() => {
          nav(`/items/${id}`);
        }, 500);
      }
    } catch (e) {
      setErr(e.message || "ผิดพลาดในการสร้างสินค้า");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto p-4">
          <p className="text-sm text-slate-700">
            กรุณาเข้าสู่ระบบก่อนเริ่มลงขายสินค้าใน H2H Thailand
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/auth?tab=login" className="text-blue-600 underline">
              เข้าสู่ระบบ
            </Link>
            <Link to="/auth?tab=register" className="text-blue-600 underline">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-5 space-y-4">
        <h1 className="text-lg font-semibold">ลงขายสินค้าใหม่</h1>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-600">{ok}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="ชื่อสินค้า" value={form.title} onChange={handleChange("title")} required />
          <Input label="ราคา" type="number" value={form.price} onChange={handleChange("price")} required />
          <Input label="สถานที่" value={form.location} onChange={handleChange("location")} />
          <Input label="หมวดหมู่" value={form.category} onChange={handleChange("category")} />
          <Input label="URL รูปภาพ" value={form.imageUrl} onChange={handleChange("imageUrl")} />

          <div>
            <label className="block text-sm mb-1">รายละเอียด</label>
            <textarea
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "กำลังสร้าง..." : "สร้างประกาศ"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
