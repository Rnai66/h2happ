// src/routes/itemsRoutes.js
import express from "express";
import mongoose from "mongoose";
import { ItemModel } from "../models/ItemModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ใช้ connection หลักที่ connectDB ตั้งไว้
const conn = mongoose.connection;
const Item = ItemModel(conn);

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
 * ME - สินค้าของฉัน (ต้องอยู่ก่อน /:id)
 * GET /api/items/me?page=1&limit=20&status=draft
 * =========================
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      sellerId: req.user._id,
      isDeleted: { $ne: true },
    };

    if (req.query.status) {
      filter.status = normalizeStatus(req.query.status, "draft");
    }

    const [items, total] = await Promise.all([
      Item.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum),
      Item.countDocuments(filter),
    ]);

    return res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      items,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * CREATE - สร้างสินค้าใหม่ (seller flow)
 * POST /api/items
 * body: { title, price, description?, images?, status? }
 * =========================
 */
router.post("/", auth, async (req, res, next) => {
  try {
    // อนุญาต seller/admin (ปรับได้)
    if (!["seller", "admin"].includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const title = (req.body.title || "").toString().trim();
    const price = parsePrice(req.body.price);
    const description = (req.body.description || "").toString().trim();

    // รองรับ images เป็น array หรือ string เดี่ยว
    let images = [];
    if (Array.isArray(req.body.images)) images = req.body.images;
    else if (typeof req.body.images === "string" && req.body.images.trim()) {
      images = [req.body.images.trim()];
    }

    const status = normalizeStatus(req.body.status, "draft");

    if (!title || !Number.isFinite(price)) {
      return res.status(400).json({
        ok: false,
        error: "missing_fields",
        message: "title และ price (number) จำเป็นต้องมี",
      });
    }

    const item = await Item.create({
      title,
      price,
      description,
      images,
      sellerId: req.user._id, // ✅ เอาจาก token ไม่รับจาก client
      status,
      isDeleted: false,
      deletedAt: null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * LIST - ดึงรายการสินค้า (public)
 * GET /api/items?page=1&limit=20&q=iphone&sellerId=xxx&status=active
 * =========================
 */
router.get("/", async (req, res, next) => {
  try {
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const q = (req.query.q || "").toString().trim();
    const sellerId = req.query.sellerId;
    const status = req.query.status ? normalizeStatus(req.query.status, "active") : "active";

    const filter = { isDeleted: { $ne: true } };
    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;

    if (q) {
      // ใช้ text index ถ้ามี
      filter.$text = { $search: q };
    }

    const [items, total] = await Promise.all([
      Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Item.countDocuments(filter),
    ]);

    return res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      items,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * DETAIL - ดูสินค้ารายการเดียว
 * GET /api/items/:id
 * ✅ match เฉพาะ ObjectId กันชน /me
 * =========================
 */
router.get("/:id([0-9a-fA-F]{24})", async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).populate("sellerId", "name email phone");

    if (!item) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * UPDATE - แก้ไขสินค้า (owner/admin)
 * PATCH /api/items/:id
 * =========================
 */
router.patch("/:id([0-9a-fA-F]{24})", auth, async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ ok: false, error: "not_found" });

    const isOwner = item.sellerId?.toString?.() === req.user._id?.toString?.();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const patch = {};

    if (req.body.title !== undefined) patch.title = req.body.title.toString().trim();
    if (req.body.description !== undefined) patch.description = req.body.description.toString().trim();

    if (req.body.price !== undefined) {
      const p = parsePrice(req.body.price);
      if (!Number.isFinite(p)) return res.status(400).json({ ok: false, error: "bad_price" });
      patch.price = p;
    }

    if (req.body.status !== undefined) {
      patch.status = normalizeStatus(req.body.status, item.status || "draft");
    }

    // กันการเปลี่ยนเจ้าของ
    delete patch.sellerId;

    Object.assign(item, patch);
    await item.save();

    return res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/**
 * UPDATE (compat) - เก็บไว้เพื่อไม่ให้ของเดิมพัง
 * PUT /api/items/:id
 */
router.put("/:id([0-9a-fA-F]{24})", auth, async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ ok: false, error: "not_found" });

    const isOwner = item.sellerId?.toString?.() === req.user._id?.toString?.();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const body = { ...req.body };
    delete body.sellerId;

    if (body.status !== undefined) body.status = normalizeStatus(body.status, item.status || "draft");
    if (body.price !== undefined) {
      const p = parsePrice(body.price);
      if (!Number.isFinite(p)) return res.status(400).json({ ok: false, error: "bad_price" });
      body.price = p;
    }

    const updated = await Item.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      body,
      { new: true }
    );

    return res.json({ ok: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================
 * SOFT DELETE - ลบสินค้าแบบไม่ลบจริง (owner/admin)
 * DELETE /api/items/:id
 * =========================
 */
router.delete("/:id([0-9a-fA-F]{24})", auth, async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ ok: false, error: "not_found" });

    const isOwner = item.sellerId?.toString?.() === req.user._id?.toString?.();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "forbidden" });
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
