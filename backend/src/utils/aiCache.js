// backend/src/utils/aiCache.js
import crypto from "crypto";
import { LRUCache } from "lru-cache";

/**
 * LRU + TTL cache for AI responses (in-memory)
 * - max: จำนวน key สูงสุด
 * - ttl: อายุ cache ต่อ key (ms)
 */
export const aiCache = new LRUCache({
  max: Number(process.env.AI_CACHE_MAX || 500),
  ttl: Number(process.env.AI_CACHE_TTL_MS || 1000 * 60 * 60), // default 1h
  allowStale: false,
  updateAgeOnGet: true, // ยืดอายุเมื่อมีคนเรียกใช้บ่อย
});

/**
 * ทำ payload ให้ "นิ่ง" เพื่อลด cache miss จาก whitespace/ตัวพิมพ์/undefined
 * แก้ปัญหา: prompt เดิมแต่ส่งข้อมูลต่างรูปแบบนิดเดียว → cache ไม่โดน
 */
export function normalizePriceAdvicePayload(body = {}) {
  const pick = (v) => (v === undefined || v === null ? "" : String(v).trim());

  return {
    // ปรับตาม fields ที่พี่ใช้จริงใน price-advice
    title: pick(body.title).toLowerCase(),
    category: pick(body.category).toLowerCase(),
    brand: pick(body.brand).toLowerCase(),
    condition: pick(body.condition).toLowerCase(),
    location: pick(body.location).toLowerCase(),
    currency: pick(body.currency || "THB").toUpperCase(),

    // numbers
    price: body.price === undefined || body.price === null ? "" : Number(body.price),
    minPrice: body.minPrice === undefined || body.minPrice === null ? "" : Number(body.minPrice),
    maxPrice: body.maxPrice === undefined || body.maxPrice === null ? "" : Number(body.maxPrice),

    // free text
    description: pick(body.description),
    // ถ้ามีรูป/attributes อื่น ให้ใส่เพิ่มแบบ stable
  };
}

/**
 * สร้าง cache key จาก normalized payload (+ optional user scope)
 * - ถ้าคำแนะนำควรต่างกันตาม "ผู้ใช้" ให้ใส่ userId
 * - ถ้าไม่เกี่ยวกับผู้ใช้ (แค่สินค้า/ราคา) ก็ไม่ต้องใส่ userId
 */
export function makePriceAdviceCacheKey({ payload, userId = "" }) {
  const raw = JSON.stringify({
    v: 1, // bump version เมื่อเปลี่ยน logic/prompt เพื่อกันชน cache เก่า
    userId: userId || "",
    payload,
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
}
