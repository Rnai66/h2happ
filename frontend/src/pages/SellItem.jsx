import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Card from "../components/ui/Card";
import { api } from "../lib/api"; // wrapper มี token ให้อยู่แล้ว

const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_ROOT = RAW_BASE.replace(/\/$/, "").replace(/\/api$/, "");

function getRole() {
  try {
    const u = JSON.parse(localStorage.getItem("h2h_user") || "null");
    return u?.role || "user";
  } catch {
    return "user";
  }
}

function maxImagesByRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return 20;
  if (r === "seller_pro" || r === "pro") return 12;
  // seller / user ปกติ
  return 6;
}

export default function SellItem() {
  const nav = useNavigate();
  const inputRef = useRef(null);

  const role = getRole();
  const MAX = maxImagesByRole(role);

  const [form, setForm] = useState({
    title: "",
    price: "",
    location: "",
    description: "",
    imageUrls: "", // ยังพิมพ์ URL ได้เหมือนเดิม (optional)
  });

  const [files, setFiles] = useState([]); // File[]
  // เก็บผล upload จาก Cloudinary: [{url, publicId, thumbUrl, previewUrl}]
  const [uploaded, setUploaded] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMessage, setOkMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function parseManualUrls(text) {
    if (!text?.trim()) return [];
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []);
    const limited = picked.slice(0, MAX);
    if (picked.length > MAX) {
      setOkMessage(
        `แพ็กเกจของคุณเลือกได้สูงสุด ${MAX} รูป (เลือกมา ${picked.length} รูป → ใช้ ${MAX} รูปแรก)`
      );
    } else {
      setOkMessage("");
    }
    setFiles(limited);
    setUploaded([]); // เปลี่ยนไฟล์แล้วล้างผล upload เดิม
    setError("");
  }

  const previews = useMemo(() => {
    // ถ้า upload แล้ว ให้ใช้ thumb/preview ของ Cloudinary (เร็ว)
    if (uploaded.length > 0) {
      return uploaded.map((x) => ({
        name: x.publicId || x.url,
        url: x.previewUrl || x.thumbUrl || x.url,
        thumb: x.thumbUrl || x.previewUrl || x.url,
      }));
    }
    // ยังไม่ upload → ใช้ objectURL
    return files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      thumb: URL.createObjectURL(f),
    }));
  }, [files, uploaded]);

  // cleanup object URLs เฉพาะตอนยังไม่ upload
  useEffect(() => {
    if (uploaded.length > 0) return;
    return () => {
      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
          URL.revokeObjectURL(p.thumb);
        } catch { }
      });
    };
  }, [previews, uploaded.length]);

  async function deleteCloudinaryByPublicId(publicId) {
    const token = localStorage.getItem("h2h_token") || "";
    const enc = encodeURIComponent(publicId);
    const res = await fetch(`${API_ROOT}/api/upload/images/${enc}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "ลบรูปไม่สำเร็จ");
    return data;
  }

  async function uploadImagesIfNeeded() {
    // ถ้า upload แล้ว ไม่ต้องซ้ำ
    if (uploaded.length > 0) return uploaded;
    if (files.length === 0) return [];

    const token = localStorage.getItem("h2h_token") || "";
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    const res = await fetch(`${API_ROOT}/api/upload/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "อัปโหลดรูปไม่สำเร็จ");
    }

    const list = (data?.files || [])
      .map((x) => ({
        url: x.url,
        publicId: x.publicId,
        thumbUrl: x.thumbUrl || null,
        previewUrl: x.previewUrl || null,
      }))
      .filter((x) => x.url);

    setUploaded(list);
    return list;
  }

  async function handleUploadOnly() {
    setError("");
    setOkMessage("");
    setLoading(true);
    try {
      const list = await uploadImagesIfNeeded();
      setOkMessage(list.length ? `✅ อัปโหลดแล้ว ${list.length} รูป` : "ยังไม่ได้เลือกรูป");
    } catch (err) {
      setError(err.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelDraft() {
    // ยกเลิก = ลบรูปที่ upload ไปแล้วทิ้ง
    setError("");
    setOkMessage("");
    setLoading(true);
    try {
      const toDelete = uploaded.filter((x) => x.publicId);
      for (const x of toDelete) {
        await deleteCloudinaryByPublicId(x.publicId);
      }
      setUploaded([]);
      setFiles([]);
      setForm({
        title: "",
        price: "",
        location: "",
        description: "",
        imageUrls: "",
      });
      setOkMessage("🧹 ยกเลิกแล้ว และลบรูปที่อัปโหลดออกจาก Cloudinary เรียบร้อย");
    } catch (err) {
      setError(err.message || "ยกเลิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMessage("");

    if (!form.title.trim()) return setError("กรุณากรอกชื่อสินค้า");
    if (!form.price || Number(form.price) <= 0) return setError("กรุณากรอกราคาให้ถูกต้อง");
    // ✅ บังคับรูปขั้นต่ำ 1 รูป (เช็คจาก uploaded หรือ files ที่รอ upload)
    const totalImages = uploaded.length + files.length + parseManualUrls(form.imageUrls).length;
    if (totalImages < 1) {
      return setError("กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูป");
    }

    setLoading(true);
    try {
      // 1) upload รูป (ถ้ามี)
      const uploadedList = await uploadImagesIfNeeded();

      // 2) รวมกับ URL ที่พิมพ์เอง (optional)
      const manual = parseManualUrls(form.imageUrls);

      // images ที่ส่งไป item ให้ใช้ "url" เป็นหลัก
      const cloudUrls = uploadedList.map((x) => x.url);
      const images = Array.from(new Set([...(cloudUrls || []), ...(manual || [])]));

      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        location: form.location.trim(),
        description: form.description.trim(),
        images,
        status: "draft",
        // (optional) เก็บ publicIds ไว้ใน DB เพื่อ cleanup ทีหลังได้
        imagePublicIds: uploadedList.map((x) => x.publicId).filter(Boolean),
      };

      await api.post("/items", payload);

      setOkMessage("✅ บันทึกร่างสินค้าแล้ว");
      setForm({ title: "", price: "", location: "", description: "", imageUrls: "" });
      setFiles([]);
      setUploaded([]);

      setTimeout(() => nav("/me/listings"), 300);
    } catch (err) {
      setError(err.message || "ลงขายไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      {/* ✅ เพิ่ม wrapper เฉพาะหน้า sell เพื่อบังคับความชัด */}
      <div className="h2h-sell max-w-xl mx-auto">
        {/* ✅ ให้ Card ใช้ธีมมืด glass ของระบบ */}
        <Card className="h2h-card">
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {/* ✅ ใช้ theme var แทน fixed white */}
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>ลงขายสินค้ามือสอง</h1>
                {/* ✅ ใช้ theme var แทน fixed white */}
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  บันทึกเป็น “ร่าง (Draft)” ก่อนเผยแพร่ • แพ็กเกจของคุณ:{" "}
                  <b style={{ color: 'var(--text-main)' }}>{role}</b> (สูงสุด {MAX} รูป)
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCancelDraft}
                className="px-3 py-2 rounded-lg border text-sm transition hover:opacity-80 disabled:opacity-60"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  background: 'var(--bg-frame)' // Use frame background for contrast
                }}
                title="ยกเลิกและลบรูปที่อัปโหลด"
              >
                ยกเลิก/ลบรูป
              </button>
            </div>

            {/* Mobile Preview */}
            {/* Mobile Preview: ใช้ Theme Colors */}
            <div className="rounded-2xl p-4 shadow-silk border transition"
              style={{ background: 'var(--bg-frame)', borderColor: 'var(--border-color)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>ตัวอย่างบนมือถือ</div>

              {/* 2x2 Grid Display (4 images) */}
              {/* Main Cover + Grid Layout - Clickable to Upload */}
              <div
                className="space-y-2 cursor-pointer active:opacity-90 transition"
                onClick={() => inputRef.current?.click()}
                title="คลิกเพื่ออัปโหลดรูป"
              >
                {/* 1. Main Cover Image (Always visible as large box) */}
                <div
                  className="rounded-xl overflow-hidden border flex items-center justify-center relative aspect-video w-full bg-black/5"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  {previews[0]?.url ? (
                    <img src={previews[0].url} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40" style={{ color: 'var(--text-muted)' }}>
                      <span className="text-2xl">📷</span>
                      <span className="text-xs">คลิกเพิ่มรูปหน้าปก</span>
                    </div>
                  )}
                  {previews[0]?.url && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
                      รูปปก (Cover)
                    </div>
                  )}
                </div>

                {/* 2. Sub Grid for Image 2,3,4... */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Create 4 slots for 2nd-5th images */}
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden border flex items-center justify-center relative bg-black/5"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      {previews[i]?.url ? (
                        <img src={previews[i].url} alt={`img-${i}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] opacity-30" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="font-semibold line-clamp-2" style={{ color: 'var(--text-main)' }}>
                  {form.title || "ชื่อสินค้า"}
                </div>
                {/* ราคาให้เด่น */}
                <div className="text-sm mt-1 font-bold" style={{ color: 'var(--text-accent)' }}>฿ {form.price || "0"}</div>
                <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {form.description || "รายละเอียดสินค้า"}
                </div>
              </div>

              {uploaded.length > 0 && (
                <div className="text-xs text-emerald-600 mt-2 font-medium">
                  Uploaded: {uploaded.length} รูป (Cloudinary)
                </div>
              )}
            </div>

            {/* ✅ ปรับ alert ให้อ่านง่ายบนพื้นมืด */}
            {error && (
              <p className="text-sm text-red-200 bg-red-950/35 border border-red-400/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            {okMessage && (
              <p className="text-sm text-emerald-200 bg-emerald-950/35 border border-emerald-400/20 px-3 py-2 rounded-lg">
                {okMessage}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                {/* ✅ label สีตามธีม */}
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>ชื่อสินค้า</label>
                <input
                  name="title"
                  type="text"
                  className="h2h-input w-full"
                  placeholder="เช่น iPhone 13 128GB สีดำ"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>ราคา (บาท)</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  className="h2h-input w-full"
                  placeholder="เช่น 12000"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>สถานที่นัดรับ / จัดส่ง</label>
                <input
                  name="location"
                  type="text"
                  className="h2h-input w-full"
                  placeholder="เช่น BTS อโศก หรือ จัดส่ง"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>รายละเอียดสินค้า</label>
                <textarea
                  name="description"
                  rows={4}
                  className="h2h-input w-full"
                  placeholder="สภาพดีมาก มีรอยนิดหน่อย ฯลฯ"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {/* Upload */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>อัปโหลดรูป (สูงสุด {MAX} รูป)</label>

                {/* ✅ file input อ่านง่าย */}
                {/* ✅ file input อ่านง่าย ตามธีม */}
                {/* ✅ file input (Hidden, triggered by ref) */}
                <input
                  type="file"
                  ref={inputRef}
                  accept="image/*"
                  multiple
                  onChange={onPickFiles}
                  className="hidden"
                />
                <div className="flex gap-3 pt-2 items-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    เลือกรูปภาพ...
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleUploadOnly}
                    className="px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition"
                  >
                    {loading ? "..." : "อัปโหลดรูป"}
                  </button>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    (หรือกด “บันทึกร่างสินค้า” ได้เลย ระบบจะอัปโหลดให้)
                  </div>
                </div>
              </div>

              {/* manual URLs */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                  ลิงก์รูปภาพ (คั่นด้วย ,) — optional
                </label>
                <textarea
                  name="imageUrls"
                  rows={2}
                  className="h2h-input w-full text-sm"
                  placeholder="https://..., https://..."
                  value={form.imageUrls}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => nav(-1)}
                >
                  ← กลับ
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white
                             bg-gradient-to-r from-[#2563EB] to-[#D4AF37]
                             hover:from-[#1D4ED8] hover:to-[#facc15]
                             disabled:opacity-60"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกร่างสินค้า"}
                </button>
              </div>

              {/* ✅ เปลี่ยน text-white/60 → theme var */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                หลังบันทึกร่างแล้ว ไปหน้า <b style={{ color: 'var(--text-main)' }}>My Listings</b> แล้วกด{" "}
                <b style={{ color: 'var(--text-main)' }}>Publish</b>
              </p>
            </form>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
