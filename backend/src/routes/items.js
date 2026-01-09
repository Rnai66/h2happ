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

    // 1. Get Connections
    const connItem = getConnection(DBNAMES.ITEM);
    const connUser = getConnection(DBNAMES.USER);

    // 2. Get Models
    const Item = ItemModel(connItem);

    // Import UserSchema dynamically or use the one we just exported if module resolution allows
    // To be safe and avoid circular dependencies or import issues, we can import it:
    const { userSchema } = await import("../models/User.js");
    const User = connUser.model("User", userSchema);

    // 3. Fetch Items
    const itemsDocs = await Item.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(); // Use lean for easier manipulation

    // 4. Collect Seller IDs
    const sellerIds = [...new Set(itemsDocs.map(i => i.sellerId).filter(id => id))];

    // 5. Fetch Sellers
    const sellers = await User.find({ _id: { $in: sellerIds } }).select("name email").lean();
    const sellerMap = sellers.reduce((acc, s) => {
      acc[s._id.toString()] = s;
      return acc;
    }, {});

    // 6. Map back to Items
    const enrichedItems = itemsDocs.map(item => {
      const s = sellerMap[item.sellerId?.toString()];

      // Fallback logic: User DB Name -> Item Stored SellerName -> "ไม่ระบุ"
      const displayName = s?.name || item.sellerName || "ไม่ระบุ";
      const displayEmail = s?.email || "-";
      const displayId = s?._id || item.sellerId;

      return {
        ...item,
        seller: {
          _id: displayId,
          name: displayName,
          email: displayEmail
        },
        // For compatibility
        sellerName: displayName
      };
    });

    return res.json({
      page: 1,
      limit: 20,
      total: enrichedItems.length,
      items: enrichedItems,
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
