import express from "express";
import ChatThread from "../models/ChatThread.js";
import ChatMessage from "../models/ChatMessage.js";
import { User } from "../models/User.js";
import { Item } from "../models/Item.js";
import Notification from "../models/Notification.js";
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
    // หา thread ที่ user นี้เป็น buyer หรือ seller
    const threads = await ChatThread.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    if (!threads.length) {
      return res.json({ ok: true, threads: [] });
    }

    // หาข้อความสุดท้ายของแต่ละ thread
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

    // ✅ Manual Population (User & Item)
    const allUserIds = new Set();
    const allItemIds = new Set();

    const isObjectId = (str) => /^[0-9a-fA-F]{24}$/.test(str);

    threads.forEach((t) => {
      const bid = t.buyerId?._id || t.buyerId;
      const sid = t.sellerId?._id || t.sellerId;
      const iid = t.itemId?._id || t.itemId;

      if (bid) allUserIds.add(String(bid));
      if (sid) allUserIds.add(String(sid));
      if (iid) allItemIds.add(String(iid));
    });

    // Filter valid IDs
    const userIdsArr = [...allUserIds].filter(isObjectId);
    const itemIdsArr = [...allItemIds].filter(isObjectId);

    let usersFound = [];
    let itemsFound = [];
    try {
      [usersFound, itemsFound] = await Promise.all([
        User.find({ _id: { $in: userIdsArr } }).lean(),
        Item.find({ _id: { $in: itemIdsArr } }).lean(),
      ]);
    } catch (err) {
      console.error("Populate error:", err);
    }

    const userMap = {};
    usersFound.forEach((u) => (userMap[String(u._id)] = u));

    const itemMap = {};
    itemsFound.forEach((i) => (itemMap[String(i._id)] = i));

    // enrich ให้ frontend ใช้ง่ายขึ้น
    const enriched = threads.map((t) => {
      const tid = t._id.toString();

      // IDs from processed thread (in case we didn't populate)
      const bid = t.buyerId?._id || t.buyerId;
      const sid = t.sellerId?._id || t.sellerId;

      const buyerId = String(bid || "");
      const sellerId = String(sid || "");

      const isBuyer = buyerId === userId;
      const partnerId = isBuyer ? sellerId : buyerId;

      const partnerUser = userMap[partnerId];
      // Fallback: real user name -> stored name -> default
      const partnerName =
        partnerUser?.name ||
        partnerUser?.username ||
        partnerUser?.email ||
        (isBuyer ? t.sellerName : t.buyerName) ||
        t.partnerName ||
        "คู่สนทนา";

      const partnerAvatar = partnerUser?.profileImage || partnerUser?.avatar || null;

      // Item logic
      const realItem = itemMap[String(t.itemId)];
      const itemTitle =
        realItem?.title ||
        t.itemSnapshot?.title ||
        t.itemTitle ||
        t.itemName ||
        "สินค้าชิ้นหนึ่ง";
      const itemImage = realItem?.images?.[0] || t.itemSnapshot?.image || null;

      return {
        ...t,
        isBuyer,
        partner: {
          id: partnerId,
          name: partnerName,
          avatar: partnerAvatar,
        },
        item: {
          id: t.itemId,
          title: itemTitle,
          image: itemImage,
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
    const thread = await ChatThread.findByIdAndUpdate(req.params.threadId, {
      lastMessageAt: new Date(),
    }, { new: true });

    // 🔔 Notification Logic
    try {
      const senderId = req.user._id.toString();
      const recipientId = senderId === String(thread.buyerId)
        ? thread.sellerId
        : thread.buyerId;

      await Notification.create({
        recipientId,
        senderId: req.user._id,
        type: "CHAT",
        title: "ข้อความใหม่",
        message: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
        link: `/chat/${thread._id}`,
        refId: thread._id
      });
    } catch (err) {
      console.error("Notification error:", err);
    }

    res.json(msg);
  } catch (e) {
    next(e);
  }
});

export default router;
