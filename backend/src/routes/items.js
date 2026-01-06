// backend/src/routes/itemsRoutes.js
import { Router } from "express";


const router = Router();

function makeMockItems() {
  return [
    {
      _id: "6748bbbb0000000000000001",        // ใช้ id คงที่ให้ flow ออเดอร์/สลิป ที่เคยเทส
      name: "Mock Item",
      title: "Mock Item",
      price: 12000,
      sellerId: "6748aaaa0000000000000002",
      images: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

router.get("/", async (_req, res) => {
  // พยายามโหลดโมดูลฝั่ง DB ถ้าพร้อม
  try {
    const { getConnection, DBNAMES } = await import("../config/dbPool.js");
    const { ItemModel } = await import("../models/Item.js");

    const conn = getConnection(DBNAMES.ITEM);
    const Item = ItemModel(conn);

    // ดึง 20 รายการล่าสุด (ไม่ดึงที่ลบอ่อน)
    const items = await Item.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      page: 1,
      limit: 20,
      total: items.length,
      items,
    });
  } catch (err) {
    // ถ้า DB ยังไม่พร้อม ให้คืน mock เพื่อให้ frontend ไปต่อได้
    console.warn("[items] DB not ready → fallback mock:", err?.message || err);
    const items = makeMockItems();
    return res.json({
      page: 1,
      limit: items.length,
      total: items.length,
      items,
    });
  }
});

/** (ออปชัน) อยากรองรับ POST /api/items ก็ใส่เพิ่มได้ภายหลัง
router.post("/", protect, async (req, res) => { ... })
*/

export default router;
