import express from "express";
import ChatThread from "../models/ChatThread.js";
import ChatMessage from "../models/ChatMessage.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * สร้าง/ดึง thread (unique per item+buyer+seller)
 *
 * POST /api/chat/threads
 * body: { itemId, buyerId, sellerId }
 */
router.post("/threads", auth, async (req, res, next) => {
  try {
    const { itemId, buyerId, sellerId } = req.body;

    if (!itemId || !buyerId || !sellerId) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_fields", message: "itemId, buyerId, sellerId required" });
    }

    const thread = await ChatThread.findOneAndUpdate(
      { itemId, buyerId, sellerId },
      {
        $setOnInsert: {
          itemId,
          buyerId,
          sellerId,
          lastMessageAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return res.json(thread);
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ ดึงทุก thread ที่ user คนนี้เกี่ยวข้อง (เป็น buyer หรือ seller)
 *
 * GET /api/chat/threads/mine
 */
router.get("/threads/mine", auth, async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "unauthorized", message: "missing user" });
    }

    const threads = await ChatThread.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    if (!threads.length) {
      return res.json({ ok: true, threads: [] });
    }

    // ดึงข้อความสุดท้ายของแต่ละ thread
    const lastMessagesByThread = {};
    for (const t of threads) {
      const tid = t._id.toString();
      const msg = await ChatMessage.findOne({ threadId: tid })
        .sort({ createdAt: -1 })
        .lean();
      if (msg) {
        lastMessagesByThread[tid] = msg;
      }
    }

    const enriched = threads.map((t) => {
      const tid = t._id.toString();
      const buyerId = t.buyerId?.toString?.() || String(t.buyerId || "");
      const sellerId = t.sellerId?.toString?.() || String(t.sellerId || "");
      const isBuyer = buyerId === userId;
      const partnerId = isBuyer ? sellerId : buyerId;

      const partnerName =
        (isBuyer ? t.sellerName : t.buyerName) ||
        t.partnerName ||
        "คู่สนทนา";

      const itemTitle =
        t.itemSnapshot?.title ||
        t.itemTitle ||
        t.itemName ||
        "สินค้าชิ้นหนึ่ง";

      return {
        ...t,
        isBuyer,
        partner: {
          id: partnerId,
          name: partnerName,
        },
        item: {
          id: t.itemId,
          title: itemTitle,
        },
        lastMessage: lastMessagesByThread[tid] || null,
      };
    });

    return res.json({ ok: true, threads: enriched });
  } catch (e) {
    console.error("GET /chat/threads/mine error", e);
    next(e);
  }
});

/**
 * ✅ ดึงข้อมูล thread เดี่ยว สำหรับหน้า /chat/:id
 *
 * GET /api/chat/threads/:threadId
 */
router.get("/threads/:threadId", auth, async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString();
    const { threadId } = req.params;

    const t = await ChatThread.findById(threadId).lean();
    if (!t) {
      return res
        .status(404)
        .json({ ok: false, error: "not_found", message: "thread not found" });
    }

    // กัน user แปลก ๆ มาดูห้องคนอื่น
    const buyerId = t.buyerId?.toString?.() || String(t.buyerId || "");
    const sellerId = t.sellerId?.toString?.() || String(t.sellerId || "");
    if (userId !== buyerId && userId !== sellerId) {
      return res
        .status(403)
        .json({ ok: false, error: "forbidden", message: "not your thread" });
    }

    const isBuyer = buyerId === userId;
    const partnerId = isBuyer ? sellerId : buyerId;

    const partnerName =
      (isBuyer ? t.sellerName : t.buyerName) ||
      t.partnerName ||
      "คู่สนทนา";

    const itemTitle =
      t.itemSnapshot?.title ||
      t.itemTitle ||
      t.itemName ||
      "สินค้าชิ้นหนึ่ง";

    const enriched = {
      ...t,
      isBuyer,
      partner: {
        id: partnerId,
        name: partnerName,
      },
      item: {
        id: t.itemId,
        title: itemTitle,
      },
    };

    return res.json(enriched);
  } catch (e) {
    console.error("GET /chat/threads/:threadId error", e);
    next(e);
  }
});

/**
 * GET /api/chat/threads/:threadId/messages
 */
router.get("/threads/:threadId/messages", auth, async (req, res, next) => {
  try {
    const msgs = await ChatMessage.find({
      threadId: req.params.threadId,
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/chat/threads/:threadId/messages
 */
router.post("/threads/:threadId/messages", auth, async (req, res, next) => {
  try {
    const { text = "", attachments = [] } = req.body || {};
    const msg = await ChatMessage.create({
      threadId: req.params.threadId,
      senderId: req.user._id,
      text,
      attachments,
      readBy: [req.user._id],
    });

    await ChatThread.findByIdAndUpdate(req.params.threadId, {
      lastMessageAt: new Date(),
    });

    res.json(msg);
  } catch (e) {
    next(e);
  }
});

export default router;
