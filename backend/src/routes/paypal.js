// backend/src/routes/paypal.js
import express from "express";
import Order from "../models/Order.js";
import { createPaypalOrder } from "../services/paypalService.js";

const router = express.Router();

/**
 * POST /api/pay/paypal/create
 * Body: { orderId, amount, currency?, note? }
 */
router.post("/create", async (req, res) => {
  try {
    console.log("📥 [PayPal] incoming body:", req.body);

    const { orderId, amount, currency, note } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
        body: req.body,
      });
    }

    const amountNum = Number(amount);
    if (!amountNum || Number.isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        message: "Invalid amount from client",
        body: req.body,
      });
    }

    console.log("📦 [PayPal] create for order:", orderId, "amount =", amountNum);

    // ดึง order มาใช้เป็น description + เช็คว่า id จริง
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found", orderId });
    }

    const orderObj = order.toObject ? order.toObject() : order;
    console.log("🧾 [PayPal] order doc (short):", {
      _id: orderObj._id,
      orderNumber: orderObj.orderNumber,
      currency: orderObj.currency,
      status: orderObj.status,
      paymentStatus: orderObj.paymentStatus,
    });

    const currencyCode = currency || orderObj.currency || "THB";

    // 🟦 สร้าง order บน PayPal (ใช้ service)
    const { paypalOrderId, approveUrl } = await createPaypalOrder({
      amount: amountNum.toFixed(2),
      currency: currencyCode,
      description:
        note || `H2H Order ${orderObj.orderNumber || orderObj._id}`,
    });

    // 📝 อัปเดตเฉพาะข้อมูลที่ schema รับชัวร์
    order.paymentProvider = "paypal";
    order.paymentRef = paypalOrderId;
    // ❌ ไม่แตะ paymentStatus ตรงนี้ ปล่อยเป็น unpaid ไปก่อน
    await order.save();

    console.log("✅ [PayPal] order created:", {
      id: paypalOrderId,
      approveUrl,
    });

    return res.status(201).json({
      ok: true,
      orderId: order._id,
      paypalOrderId,
      approveUrl,
    });
  } catch (err) {
    console.error("❌ [PayPal] create error:", err);

    return res.status(500).json({
      message: "PayPal create failed",
      error: String(err?.message || err),
    });
  }
});

export default router;
