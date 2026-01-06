import express from "express";
import ChatThread from "../models/ChatThread.js";
import ChatMessage from "../models/ChatMessage.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// สร้าง/ดึง thread (unique per item+buyer+seller)
router.post("/threads", auth, async (req, res, next) => {
  try {
    const { itemId, buyerId, sellerId } = req.body;
    const thread = await ChatThread.findOneAndUpdate(
      { itemId, buyerId, sellerId },
      { $setOnInsert: { itemId, buyerId, sellerId } },
      { new: true, upsert: true }
    );
    res.json(thread);
  } catch (e) {
    next(e);
  }
});

// ✅ ดึงทุก thread ที่ user คนนี้เกี่ยวข้อง (เป็น buyer หรือ seller)
router.get("/threads/mine", auth, async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, error: "unauthorized", message: "missing user" });
    }

    // หา thread ที่ user นี้เป็น buyer หรือ seller
    const threads = await ChatThread.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    if (!threads.length) {
      return res.json({ ok: true, threads: [] });
    }

    // หาข้อความสุดท้ายของแต่ละ thread แบบง่าย ๆ (วนทีละตัว)
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

    // enrich ให้ frontend ใช้ง่ายขึ้น
    const enriched = threads.map((t) => {
      const tid = t._id.toString();
      const buyerId = t.buyerId?.toString?.() || String(t.buyerId || "");
      const sellerId = t.sellerId?.toString?.() || String(t.sellerId || "");
      const isBuyer = buyerId === userId;

      const partnerId = isBuyer ? sellerId : buyerId;

      // ถ้าทีหลังพี่เพิ่ม field buyerName/sellerName ก็จะโชว์สวยขึ้น
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
