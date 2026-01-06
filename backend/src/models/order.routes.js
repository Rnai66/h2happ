import express from "express";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/** Create Order — INITIATED */
router.post("/", auth, async (req, res, next) => {
  try {
    const { itemId, sellerId, price, method = "cash_meetup" } = req.body;
    const buyerId = req.user._id;

    if (!itemId || !sellerId || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = await Order.create({
      itemId,
      buyerId,
      sellerId,
      price,
      method,
      status: "INITIATED"
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

/** List user's orders */
router.get("/", auth, async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

/** Get order detail */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

/** Update order status (Seller / Buyer actions) */
router.patch("/:id/status", auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = [
      "INITIATED", "PENDING_PAYMENT", "PAID_PENDING_VERIFY",
      "PAID_VERIFIED", "FULFILLED", "COMPLETED", "CANCELLED"
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    next(err);
  }
});
