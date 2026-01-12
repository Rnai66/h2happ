import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Card from "../components/ui/Card";
import { api } from "../lib/api"; // wrapper มี token ให้อยู่แล้ว

import { Capacitor } from "@capacitor/core";

// 🟢 FIX: Cleaned up URL logic
// Actually, let's match lib/api.js logic exactly.
const DEFAULT_BASE = import.meta.env.VITE_API_BASE || "http://10.0.2.2:4010";
let RAW_BASE = DEFAULT_BASE;

if (Capacitor.isNativePlatform()) {
  RAW_BASE = "http://10.0.2.2:4010";
}

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

  const role = getRole();
  const MAX = maxImagesByRole(role);

  const CATEGORIES = [
    "มือถือและแท็บเล็ต",
    "คอมพิวเตอร์และแล็ปท็อป",
    "ยานยนต์",
    "อสังหาริมทรัพย์",
    "เสื้อผ้าแฟชั่นชาย",
    "เสื้อผ้าแฟชั่นหญิง",
    "นาฬิกาและเครื่องประดับ",
    "เฟอร์นิเจอร์และของแต่งบ้าน",
    "เครื่องใช้ไฟฟ้า",
    "กีฬาสัตว์เลี้ยง",
    "แม่และเด็ก",
    "เกมและของเล่น",
    "กล้องและอุปกรณ์",
    "พระเครื่อง",
    "หนังสือ",
    "งานอดิเรก",
    "อื่น ๆ"
  ];

  const [form, setForm] = useState({
    title: "",
    price: "",
    quantity: "1",
    location: "",
    category: "",
    description: "",
    imageUrls: "",
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

  function triggerFileInput() {
    document.getElementById("hidden-file-input")?.click();
  }

  function removeFile(index) {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    // If uploaded, remove from uploaded list too?
    // For simplicity, reset uploaded if files change (logic existing in onPickFiles)
    // checking logic: if we remove a file, we should probably reset upload state or handle complex sync.
    // simpler: clear uploaded and let user re-upload or just filter files.
    // Existing logic clears uploaded on new pick. Let's keep it consistent:
    setUploaded([]);

    // Also update okMessage
    if (newFiles.length === 0) setOkMessage("");
  }


  async function handleSubmit(e, targetStatus = "draft") {
    e.preventDefault();
    setError("");
    setOkMessage("");

    if (!form.title.trim()) return setError("กรุณากรอกชื่อสินค้า");
    if (!form.price || Number(form.price) <= 0) return setError("กรุณากรอกราคาให้ถูกต้อง");
    if (!form.quantity || Number(form.quantity) < 0) return setError("กรุณากรอกจำนวนสินค้าให้ถูกต้อง");

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
        quantity: Number(form.quantity),
        location: form.location.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        images,
        status: targetStatus, // ✅ Use target status (draft or active)
        // (optional) เก็บ publicIds ไว้ใน DB เพื่อ cleanup ทีหลังได้
        imagePublicIds: uploadedList.map((x) => x.publicId).filter(Boolean),
      };

      await api.post("/items", payload);

      setOkMessage(targetStatus === "active" ? "✅ เผยแพร่สินค้าแล้ว!" : "✅ บันทึกร่างสินค้าแล้ว");
      setForm({ title: "", price: "", quantity: "1", location: "", category: "", description: "", imageUrls: "" });
      setFiles([]);
      setUploaded([]);

      setTimeout(() => nav("/me/listings"), 800);
    } catch (err) {
      setError(err.message || "ลงขายไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="h2h-sell max-w-xl mx-auto pb-20">
        <Card className="h2h-card">
          <div className="p-4 md:p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-[var(--text-main)]">ลงขายสินค้า</h1>
              <div className="text-xs text-[var(--text-muted)]">
                แพ็กเกจ: <b className="text-[var(--text-main)]">{role}</b> (Max {MAX})
              </div>
            </div>

            {/* ✅ 1. Image Grid (Top) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-main)]">รูปภาพสินค้า ({files.length}/{MAX})</label>

              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {/* Upload Button */}
                {files.length < MAX && (
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--glass-border)]
                               flex flex-col items-center justify-center gap-1
                               hover:bg-[var(--glass-border)] transition text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px]">เพิ่มรูป</span>
                  </button>
                )}

                {/* Previews */}
                {previews.map((p, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--glass-border)] bg-black/5 group">
                    <img src={p.thumb || p.url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                      ×
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">ปก</div>}
                  </div>
                ))}
              </div>

              {/* Hidden Input */}
              <input
                id="hidden-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onPickFiles}
                className="hidden"
              />
            </div>

            {/* Error/Success Messages */}
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

            {/* Form Fields */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-main)]">ชื่อสินค้า *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="เช่น iPhone 13 สภาพนางฟ้า"
                  className="h2h-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[var(--text-main)]">ราคา (฿) *</label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    className="h2h-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-[var(--text-main)]">หมวดหมู่</label>
                  <input
                    name="category"
                    list="category-options"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="เลือกหมวดหมู่..."
                    className="h2h-input w-full"
                  />
                  <datalist id="category-options">
                    {CATEGORIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-main)]">สถานที่นัดรับ *</label>
                <input
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="เช่น BTS อโศก, จัดส่งด่วน"
                  className="h2h-input w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-main)]">จำนวนสินค้า *</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="1"
                  className="h2h-input w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-main)]">รายละเอียด</label>
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="h2h-input w-full"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")} // Draft Status
                disabled={loading}
                className="px-4 py-3 rounded-xl font-medium text-[var(--text-main)] bg-[var(--glass-border)] hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                บันทึกร่าง
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, "active")} // Active Status
                disabled={loading}
                className="px-4 py-3 rounded-xl font-medium text-white
                            bg-gradient-to-r from-[#2563EB] to-[#D4AF37] shadow-lg
                            hover:scale-[1.02] active:scale-[0.98] transition"
              >
                {loading ? "กำลังบันทึก..." : "เผยแพร่ (Publish)"}
              </button>
            </div>

            <div className="flex justify-center pt-2">
              <button onClick={handleCancelDraft} className="text-xs text-[var(--text-muted)] underline">
                ล้างข้อมูล
              </button>
            </div>

          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
