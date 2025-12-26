import express from "express";
import OpenAI from "openai";
import crypto from "crypto";
import { LRUCache } from "lru-cache";

console.log("🔥 ai.js ROUTE FILE LOADED");

const router = express.Router();

const aiCache = new LRUCache({
  max: Number(process.env.AI_CACHE_MAX || 500),
  ttl: Number(process.env.AI_CACHE_TTL_MS || 1000 * 60 * 60),
  allowStale: false,
  updateAgeOnGet: true,
});

// 🔁 ใช้ map นี้เพื่อ coalescing → ถ้ามีคนยิง key เดียวกันพร้อมกัน จะรอ promise เดียวกัน
const pendingPromises = new Map();

// ====== Helper functions ======
function normStr(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim().toLowerCase();
}

function normNum(v) {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function makeCacheKey({ query, stats }) {
  const stable = {
    v: 1,
    query: normStr(query),
    stats: {
      count: normNum(stats?.count),
      avgPrice: normNum(stats?.avgPrice),
      medianPrice: normNum(stats?.medianPrice),
      minPrice: normNum(stats?.minPrice),
      maxPrice: normNum(stats?.maxPrice),
    },
  };
  const raw = JSON.stringify(stable);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ====== Main Route ======
router.post("/price-advice", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, message: "OPENAI_API_KEY missing" });
    }

    const { query, stats, sampleItems } = req.body || {};
    if (!query) {
      return res.status(400).json({ ok: false, message: "Missing query" });
    }

    const cacheKey = makeCacheKey({ query, stats });

    // === Cache HIT ===
    const cachedAdvice = aiCache.get(cacheKey);
    if (cachedAdvice) {
      res.setHeader("X-Cache", "HIT");
      return res.json({ ok: true, advice: cachedAdvice, cached: true });
    }

    res.setHeader("X-Cache", "MISS");

    // === Coalescing ===
    if (pendingPromises.has(cacheKey)) {
      const shared = await pendingPromises.get(cacheKey);
      return res.json({ ok: true, advice: shared, cached: false, shared: true });
    }

    // === NEW Request ===
    const promise = (async () => {
      const client = new OpenAI({ apiKey });

      const system = `
คุณคือผู้ช่วยวิเคราะห์ราคาสินค้ามือสองในประเทศไทย
หน้าที่ของคุณคือช่วยประเมินว่า “ราคาประมาณไหนเหมาะสม”
เพื่อใช้เป็นแนวทางในการซื้อหรือขาย

ให้ตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้าง:
- summary: สรุปผลสั้น ๆ เป็นภาษาไทย อ่านง่าย 1–2 บรรทัด
- suggestedPrice: ราคาที่แนะนำ (ตัวเลขเท่านั้น)
- bullets: เหตุผลประกอบแบบสั้น ๆ 3–6 ข้อ (ภาษาไทย)
- risks: ข้อควรพิจารณา หรือความไม่แน่นอน 1–2 ประโยค (ภาษาไทย)

แนวทางการตอบ:
- ใช้ภาษาคนทั่วไป หลีกเลี่ยงคำเทคนิค
- มองว่าเป็น “แนวทางประกอบการตัดสินใจ”
- หากข้อมูลมีจำกัด ให้ประเมินจากราคาเฉลี่ยหรือราคากลาง
- ระบุความไม่แน่นอนในส่วน risks อย่างสุภาพ
- ห้ามตอบนอก JSON
      `.trim();

      const payload = {
        query,
        stats: {
          count: normNum(stats?.count),
          avgPrice: normNum(stats?.avgPrice),
          medianPrice: normNum(stats?.medianPrice),
          minPrice: normNum(stats?.minPrice),
          maxPrice: normNum(stats?.maxPrice),
        },
        sampleItems: Array.isArray(sampleItems)
          ? sampleItems.slice(0, 6)
          : [],
      };

      const resp = await client.chat.completions.create({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(payload) },
        ],
      });

      const text = resp.choices?.[0]?.message?.content || "{}";

      let advice;
      try {
        advice = JSON.parse(text);
      } catch {
        advice = {
          summary: "ข้อมูลยังไม่เพียงพอสำหรับการประเมินราคาอย่างแม่นยำ",
          suggestedPrice: normNum(stats?.medianPrice) || normNum(stats?.avgPrice) || 0,
          bullets: [
            "จำนวนสินค้าที่ใช้เปรียบเทียบยังมีจำกัด",
            "ราคาตลาดอาจแตกต่างกันตามสภาพสินค้า",
          ],
          risks: "ควรใช้ข้อมูลนี้เป็นแนวทางเบื้องต้น และพิจารณาปัจจัยอื่นร่วมด้วย",
        };
      }

      // === Save to cache ===
      aiCache.set(cacheKey, advice);
      return advice;
    })();

    // เก็บ pending ไว้
    pendingPromises.set(cacheKey, promise);

    let result;
    try {
      result = await promise;
    } finally {
      pendingPromises.delete(cacheKey); // ลบเมื่อเสร็จแล้ว
    }

    return res.json({ ok: true, advice: result, cached: false });
  } catch (err) {
    console.error("❌ ai/price-advice error:", err);
    return res.status(500).json({ ok: false, message: "AI server error" });
  }
});

export default router;
