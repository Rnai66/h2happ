// =========================================================
//   H2H Payment Router (MOCK + PayPal + Webhook + Slip + Verify)
// =========================================================

import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import multer from "multer";
import fetch from "node-fetch";

import { OrderModel } from "../models/OrderModel.js";
import { PaymentModel } from "../models/PaymentModel.js";

const router = express.Router();
const conn = mongoose.connection;
const Order = OrderModel(conn);
const Payment = PaymentModel(conn);

// ================== Upload slip directory ==================
const uploadsRoot = path.join(process.cwd(), "uploads");
const slipsDir = path.join(uploadsRoot, "slips");
if (!fs.existsSync(slipsDir)) fs.mkdirSync(slipsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: slipsDir,
    filename: (req, file, cb) => {
      cb(null, "slip_" + Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("File must be image")),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ================== Helper: final paid ==================
async function markOrderPaid(order, opts = {}) {
  if (!order) return;

  const amount = opts.amount ?? order.amount;
  order.paymentStatus = "paid";
  order.status = "completed";
  order.amount = amount;
  await order.save();

  const existing = await Payment.findOne({ orderId: order._id });
  const p = existing || new Payment({ orderId: order._id });

  Object.assign(p, {
    orderId: order._id,
    itemId: order.itemId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    amount,
    currency: order.currency || "THB",
    status: "paid",
    paidAt: opts.paidAt || new Date(),
    method: opts.method,
    slipImageUrl: opts.slipImageUrl || p.slipImageUrl || "",
    paypalOrderId: opts.paypalOrderId || p.paypalOrderId || "",
    paypalCaptureId: opts.paypalCaptureId || p.paypalCaptureId || "",
  });

  await p.save();
  return p;
}

// =========================================================
// MOCK PAYMENT
// =========================================================
// =========================================================
// MANUAL CONFIRM (Buyer clicks 'Paid')
// =========================================================
router.post("/confirm", async (req, res) => {
  const { orderId, amount, method } = req.body;
  if (!orderId) return res.status(400).json({ ok: false, error: "missing_order" });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ ok: false, error: "order_not_found" });

  // Update to pending verification
  order.paymentStatus = "pending_verification"; // Wait for seller/webhook
  order.status = "pending";
  // order.proofOfPayment should be set via /slip upload separately
  await order.save();

  // Create Payment record if not exists
  await Payment.findOneAndUpdate(
    { orderId },
    {
      orderId,
      amount: amount || order.amount,
      method,
      status: "pending",
      currency: "THB"
    },
    { upsert: true }
  );

  return res.json({ ok: true, order });
});

// =========================================================
// GENERIC WEBHOOK (Bank/Payment Gateway)
// =========================================================
router.post("/webhook", express.json(), async (req, res) => {
  console.log("🔔 Generic Webhook:", req.body);
  // Expected payload: { orderId, status: 'success'|'failed', amount, meta }
  const { orderId, status, amount } = req.body;

  if (orderId && status === 'success') {
    const order = await Order.findById(orderId);
    if (order) {
      await markOrderPaid(order, { amount, method: 'webhook' });
      console.log(`✅ Order ${orderId} marked paid via webhook`);
    }
  }
  return res.json({ ok: true });
});

// =========================================================
// PAYPAL CONFIG
// =========================================================
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

const PAYPAL_BASE =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// === Token function
async function getPPtoken() {
  const token = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) throw new Error("PayPal token failed");
  return (await r.json()).access_token;
}

// =========================================================
// CREATE PAYPAL ORDER  (✔ แก้เรียบร้อย)
// =========================================================
router.post("/paypal/create", async (req, res) => {
  console.log("📥 [PayPal] incoming body:", req.body);

  const { orderId, amount } = req.body;
  if (!orderId) return res.status(400).json({ ok: false, error: "orderId is required" });
  if (!PAYPAL_CLIENT_ID) return res.status(500).json({ ok: false, error: "paypal_not_configured" });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ ok: false, error: "order_not_found" });

  const final = amount ?? order.amount;
  const token = await getPPtoken();

  const create = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: order.currency || "THB", value: final.toFixed(2) }, reference_id: orderId }],
      application_context: {
        return_url: `${process.env.CLIENT_BASE_URL || "http://localhost:5173"}/orders/${orderId}?paypal_return=1`,
        cancel_url: `${process.env.CLIENT_BASE_URL || "http://localhost:5173"}/orders/${orderId}?paypal_cancel=1`,
      },
    }),
  });

  const data = await create.json();
  const link = data.links?.find((x) => x.rel === "approve")?.href;

  if (!link) return res.status(400).json({ ok: false, error: "no_approve_link", data });

  await Payment.findOneAndUpdate(
    { orderId, method: "paypal" },
    { orderId, method: "paypal", amount: final, status: "pending", paypalOrderId: data.id },
    { upsert: true }
  );

  return res.json({ ok: true, approveUrl: link, paypalOrderId: data.id });
});

// =========================================================
// WEBHOOK (PayPal → Auto-complete order)
// =========================================================
router.post("/paypal/webhook", express.json(), async (req, res) => {
  console.log("📩 PayPal Webhook:", req.body.event_type);

  const e = req.body;
  const ref = e?.resource?.purchase_units?.[0]?.reference_id;
  if (!ref) return res.json({ ok: true, skip: true });

  const order = await Order.findById(ref);
  if (!order) return res.json({ ok: true, skip_order: true });

  if (["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"].includes(e.event_type)) {
    await markOrderPaid(order, {
      method: "paypal",
      amount: e.resource?.purchase_units?.[0]?.amount?.value,
      paypalOrderId: e.resource.id,
    });
    console.log("🔥 PayPal success order:", ref);
  }

  return res.json({ ok: true });
});

// =========================================================
// Upload slip
// =========================================================
router.post("/:id/slip", upload.single("slip"), async (req, res) => {
  const id = req.params.id;
  const o = await Order.findById(id);
  if (!o) return res.status(404).json({ ok: false });

  const p = await Payment.findOneAndUpdate(
    { orderId: id },
    { slipImageUrl: `/uploads/slips/${req.file.filename}`, status: "pending" },
    { upsert: true, new: true }
  );

  return res.json({ ok: true, payment: p });
});

// =========================================================
// Admin verify
// =========================================================
router.post("/:pid/verify", async (req, res) => {
  const p = await Payment.findById(req.params.pid);
  if (!p) return res.status(404).json({ ok: false });

  const o = await Order.findById(p.orderId);
  await markOrderPaid(o, { method: p.method, amount: p.amount });

  return res.json({ ok: true, verified: true });
});

export default router;
