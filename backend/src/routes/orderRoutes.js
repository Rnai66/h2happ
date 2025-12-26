// src/routes/orderRoutes.js
import express from "express";
import mongoose from "mongoose";
import { OrderModel } from "../models/OrderModel.js";
import { ItemModel } from "../models/ItemModel.js";

const router = express.Router();

const conn = mongoose.connection;
const Order = OrderModel(conn);
const Item = ItemModel(conn);

// helper สร้างเลขออเดอร์
function genOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `H2H-${year}-${rand}`;
}

/**
 * CREATE ORDER (ไม่ผูก auth ตอนนี้)
 * POST /api/orders
 * body: { itemId, buyerId, amount? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { itemId, buyerId, amount } = req.body;

    if (!itemId || !buyerId) {
      return res.status(400).json({
        ok: false,
        error: "missing_fields",
        message: "itemId, buyerId is required",
      });
    }

    const item = await Item.findOne({ _id: itemId, isDeleted: false });
    if (!item) {
      return res.status(404).json({ ok: false, error: "item_not_found" });
    }

    const finalAmount =
      typeof amount === "number" && amount > 0 ? amount : item.price;

    const order = await Order.create({
      orderNumber: genOrderNumber(),
      itemId: item._id.toString(),
      buyerId,
      sellerId: item.sellerId,
      amount: finalAmount,
      currency: "THB",
      status: "pending",
      paymentStatus: "unpaid",
      itemSnapshot: {
        title: item.title,
        price: item.price,
        images: item.images,
      },
    });

    return res.status(201).json({ ok: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * LIST ORDERS
 * GET /api/orders?buyerId=xxx&sellerId=yyy&status=pending&page=1&limit=20
 */
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      buyerId,
      sellerId,
      status,
      paymentStatus,
    } = req.query;

    const filter = { isDeleted: false };

    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DETAIL
 * GET /api/orders/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * UPDATE STATUS
 * PATCH /api/orders/:id/status
 */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;

    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    if (!Object.keys(update).length) {
      return res.status(400).json({
        ok: false,
        error: "missing_update_fields",
        message: "status or paymentStatus required",
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      update,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * SOFT DELETE
 * DELETE /api/orders/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    return res.json({ ok: true, message: "soft_deleted", order });
  } catch (err) {
    next(err);
  }
});

export default router;
