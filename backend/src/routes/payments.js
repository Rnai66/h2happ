import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { PaymentModel } from "../models/Payment.js";
import { protect, authorize } from "../middleware/auth.js";
import { parsePaging } from "../helpers/pagination.js";

const router = Router();

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req);
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const [payments, total] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments()
    ]);
    res.json({ page, limit, total, payments });
  } catch (e) {
    res.status(500).json({ message: "Failed to list payments", error: e.message });
  }
});

router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (e) {
    res.status(500).json({ message: "Failed to get payment", error: e.message });
  }
});

router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { orderId, amount, method, status, meta } = req.body;
    if (!orderId || amount == null) return res.status(400).json({ message: "orderId, amount required" });
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const p = await Payment.create({ orderId, amount, method, status, meta });
    res.status(201).json({ payment: p });
  } catch (e) {
    res.status(500).json({ message: "Failed to create payment", error: e.message });
  }
});

router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { orderId, amount, method, status, meta } = req.body;
    const update = {};
    if (orderId !== undefined) update.orderId = orderId;
    if (amount !== undefined) update.amount = amount;
    if (method !== undefined) update.method = method;
    if (status !== undefined) update.status = status;
    if (meta !== undefined) update.meta = meta;
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const r = await Payment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!r) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment: r });
  } catch (e) {
    res.status(500).json({ message: "Failed to update payment", error: e.message });
  }
});

router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const r = await Payment.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete payment", error: e.message });
  }
});

export default router;
