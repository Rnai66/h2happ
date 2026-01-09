// backend/src/routes/item.routes.js
import express from "express";
import { Item } from "../models/Item.js";
import auth from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

function normalizeStatus(raw, fallback = "draft") {
  const allowed = new Set(["draft", "active", "reserved", "sold", "hidden"]);
  const s = (raw ?? fallback).toString().trim().toLowerCase();
  return allowed.has(s) ? s : fallback;
}

function parsePrice(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * =========================
 * GET /api/items/me  (auth)
 * ✅ ต้องอยู่ก่อน /:id
 * =========================
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      sellerId: req.user._id,
      isDeleted: { $ne: true },
    };

    if (req.query.status) filter.status = normalizeStatus(req.query.status, "draft");

    const [items, total] = await Promise.all([
      Item.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Item.countDocuments(filter),
    ]);

    return res.json({ ok: true, items, page: pageNum, limit: limitNum, total });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * GET /api/items  (public)
 * =========================
 */
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 40, status = "active", q = "" } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 40));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: { $ne: true } };

    if (status) filter.status = normalizeStatus(status, "active");

    const keyword = (q || "").toString().trim();
    if (keyword) filter.title = { $regex: keyword, $options: "i" };

    const itemsDocs = await Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
    const total = await Item.countDocuments(filter);

    // Manual Populate
    const sellerIds = [...new Set(itemsDocs.map(i => i.sellerId).filter(id => id))];
    const users = await User.find({ _id: { $in: sellerIds } }).select("name email").lean();

    // Create Map
    const userMap = {};
    users.forEach(u => { userMap[String(u._id)] = u; });

    // Map back
    const items = itemsDocs.map(it => {
      const u = userMap[String(it.sellerId)];
      return {
        ...it,
        seller: {
          _id: u?._id || it.sellerId,
          name: u?.name || it.sellerName || "ไม่ระบุ",
          email: u?.email || "-"
        },
        sellerName: u?.name || it.sellerName || "ไม่ระบุ"
      };
    });

    return res.json({ items, page: pageNum, limit: limitNum, total });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * GET /api/items/:id  (public)
 * ✅ match เฉพาะ ObjectId กันชน /me
 * =========================
 */
router.get("/:id([0-9a-fA-F]{24})", async (req, res, next) => {
  try {
    const it = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
    if (!it) return res.status(404).json({ message: "Item not found" });

    // Manual Populate for single item
    let seller = {};
    if (it.sellerId) {
      const u = await User.findById(it.sellerId).select("name email").lean();
      if (u) {
        seller = { _id: u._id, name: u.name, email: u.email };
      }
    }

    // Fallback
    const finalName = seller.name || it.sellerName || "ไม่ระบุ";
    it.seller = {
      _id: seller._id || it.sellerId,
      name: finalName,
      email: seller.email || "-"
    };
    it.sellerName = finalName;

    return res.json(it);
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * POST /api/items (auth)
 * ✅ รับ status ได้ (draft/active/...)
 * ✅ owner จาก token ไม่รับ sellerId จาก client
 * =========================
 */
router.post("/", auth, async (req, res, next) => {
  try {
    const {
      title,
      price,
      location = "",
      description = "",
      images = [],
      category = "",
      condition = "good",
      status,
    } = req.body;

    const t = (title || "").toString().trim();
    const p = parsePrice(price);

    if (!t || !Number.isFinite(p)) {
      return res.status(400).json({ message: "กรุณากรอกชื่อสินค้าและราคาให้ถูกต้อง" });
    }

    const sellerId = req.user?._id;
    const sellerName = req.user?.name || req.user?.displayName || req.user?.email || "Unknown seller";

    const item = await Item.create({
      title: t,
      price: p,
      location: (location || "").toString(),
      description: (description || "").toString(),
      images: Array.isArray(images) ? images : [],
      category: (category || "").toString(),
      condition: (condition || "good").toString(),
      status: normalizeStatus(status, "draft"), // ✅ default draft
      sellerId,
      sellerName,
      isDeleted: false,
      deletedAt: null,
    });

    // ถ้ายังไม่เป็น seller → อัปเดต role
    if (req.user.role !== "seller") {
      await User.findByIdAndUpdate(sellerId, { role: "seller" });
    }

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * PATCH /api/items/:id  (auth owner/admin)
 * ใช้เปลี่ยน status / title / price / desc
 * =========================
 */
router.patch("/:id([0-9a-fA-F]{24})", auth, async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const isOwner = item.sellerId?.toString?.() === req.user._id?.toString?.();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.body.title !== undefined) item.title = req.body.title.toString().trim();
    if (req.body.description !== undefined) item.description = req.body.description.toString().trim();
    if (req.body.location !== undefined) item.location = req.body.location.toString();
    if (req.body.category !== undefined) item.category = req.body.category.toString();
    if (req.body.condition !== undefined) item.condition = req.body.condition.toString();

    if (req.body.price !== undefined) {
      const p = parsePrice(req.body.price);
      if (!Number.isFinite(p)) return res.status(400).json({ message: "Bad price" });
      item.price = p;
    }

    if (req.body.status !== undefined) {
      item.status = normalizeStatus(req.body.status, item.status || "draft");
    }

    await item.save();
    return res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * DELETE /api/items/:id  (auth owner/admin)
 * Soft delete
 * =========================
 */
router.delete("/:id([0-9a-fA-F]{24})", auth, async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const isOwner = item.sellerId?.toString?.() === req.user._id?.toString?.();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    item.isDeleted = true;
    item.deletedAt = new Date();
    await item.save();

    return res.json({ ok: true, message: "soft_deleted", item });
  } catch (err) {
    next(err);
  }
});

export default router;
