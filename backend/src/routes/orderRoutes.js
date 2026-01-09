import express from "express";
import mongoose from "mongoose";
import { OrderModel } from "../models/OrderModel.js";
import { ItemModel } from "../models/ItemModel.js";
import Notification from "../models/Notification.js";
import protect from "../middleware/auth.js";

const router = express.Router();

const conn = mongoose.connection;
const Order = OrderModel(conn);
const Item = ItemModel(conn);



router.patch("/:id/status", protect, async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const userId = req.user.id; // from protect middleware

    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    // 🔒 Lock if completed/paid (unless admin)
    if (req.user.role !== "admin" && (order.status === "completed" || order.paymentStatus === "paid")) {
      return res.status(403).json({ ok: false, error: "locked", message: "Order is completed and cannot be modified" });
    }

    // Verify ownership and permissions
    const isSeller = String(order.sellerId) === String(userId);
    const isBuyer = String(order.buyerId) === String(userId);

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ ok: false, error: "unauthorized", message: "Not authorized" });
    }

    const update = {};
    if (status) {
      if (isBuyer) {
        // Buyer can ONLY cancel, and only if pending
        if (status !== "cancelled") {
          return res.status(403).json({ ok: false, error: "unauthorized", message: "Buyer can only cancel orders" });
        }
        if (order.status !== "pending") {
          return res.status(400).json({ ok: false, error: "bad_request", message: "Cannot cancel processed order" });
        }
      }
      update.status = status;
    }
    if (paymentStatus) {
      // Only seller can update payment status
      if (!isSeller) {
        return res.status(403).json({ ok: false, error: "unauthorized", message: "Only seller can update payment status" });
      }
      update.paymentStatus = paymentStatus;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({
        ok: false,
        error: "missing_update_fields",
        message: "status or paymentStatus required",
      });
    }

    // Update with timestamp
    // Note: Mongoose timestamps handle updatedAt automatically, but explicit update is fine too
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    return res.json({ ok: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
});

// ✅ Upload Proof of Payment (Slip)
router.patch("/:id/slip", protect, async (req, res, next) => {
  try {
    const { proofOfPayment } = req.body;
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ ok: false, error: "not_found" });

    // 🔒 Lock if completed/paid (unless admin)
    if (req.user.role !== "admin" && (order.status === "completed" || order.paymentStatus === "paid")) {
      return res.status(403).json({ ok: false, error: "locked", message: "Order is completed and cannot be modified" });
    }

    // Verify ownership
    const userId = req.user.id;
    if (String(order.buyerId) !== String(userId) && String(order.sellerId) !== String(userId)) {
      return res.status(403).json({ ok: false, error: "unauthorized" });
    }

    order.proofOfPayment = proofOfPayment;
    await order.save();

    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
});


router.delete("/:id", protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    // Verify ownership (Buyer or Seller can delete/hide)
    const userId = req.user.id;
    if (String(order.buyerId) !== String(userId) && String(order.sellerId) !== String(userId)) {
      return res.status(403).json({ ok: false, error: "unauthorized", message: "You do not have permission to delete this order" });
    }

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    return res.json({ ok: true, message: "soft_deleted", order });
  } catch (err) {
    next(err);
  }
});



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

    // 🔔 Notification Logic
    try {
      // Notify Seller
      await Notification.create({
        recipientId: item.sellerId,
        senderId: buyerId,
        type: "ORDER_SELL",
        title: "📦 มีคำสั่งซื้อใหม่!",
        message: `สินค้า "${item.title}" ถูกสั่งซื้อแล้ว`,
        link: `/orders/${order._id}`,
        refId: order._id
      });

      // Notify Buyer
      await Notification.create({
        recipientId: buyerId,
        senderId: null, // System
        type: "ORDER_BUY",
        title: "✅ สั่งซื้อสำเร็จ",
        message: `คุณสั่งซื้อสินค้า "${item.title}" เรียบร้อยแล้ว`,
        link: `/orders/${order._id}`,
        refId: order._id
      });
    } catch (err) {
      console.error("Order Notification error:", err);
    }

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

// DETAIL
// DETAIL
// GET /api/orders/:id
router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).lean();

    if (!order) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    // Fetch Seller info (for PromptPay QR)
    // Dynamic import to avoid circular dep issues if any, or just use mongoose.model
    // But better to use the imported Model if available. 
    // I will use mongoose.model("User") as I haven't imported it at top yet.
    // Wait, User model is standard. I should check if it's registered.
    // Usually server.js registers models.

    let sellerInfo = null;
    let buyerInfo = null;
    try {
      const User = mongoose.models.User;
      if (User) {
        if (order.sellerId) {
          sellerInfo = await User.findById(order.sellerId).select("name email phone");
        }
        if (order.buyerId) {
          buyerInfo = await User.findById(order.buyerId).select("name email");
        }
      }
    } catch (e) {
      console.error("Error fetching user info", e);
    }

    return res.json({ ok: true, order, seller: sellerInfo, buyer: buyerInfo });
  } catch (err) {
    next(err);
  }
});

export default router;
