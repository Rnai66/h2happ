import express from "express";
import Order from "../models/Order.js";
import { verifyPaypalWebhookSignature } from "../services/paypalService.js";
import { awardTokensForPaidOrder } from "../services/tokenRewardService.js";

const router = express.Router();

function pickValidPaymentStatusValue(orderModel, preferred) {
  const enums = orderModel?.schema?.path("paymentStatus")?.enumValues || [];
  if (!enums.length) return preferred;

  const candidates = [
    preferred,
    "paid",
    "PAID",
    "completed",
    "COMPLETED",
    "success",
    "SUCCESS",
    "unpaid",
    "UNPAID",
  ];
  return candidates.find((v) => enums.includes(v)) || null;
}

function safeParsePaypalEvent(req) {
  try {
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString("utf8");
      return text ? JSON.parse(text) : null;
    }
    if (req.body && typeof req.body === "object") return req.body;
    return null;
  } catch {
    return null;
  }
}

function lowerHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [String(k).toLowerCase(), v])
  );
}

function hasPaypalSignatureHeaders(headers = {}) {
  const h = lowerHeaders(headers);
  return Boolean(
    h["paypal-auth-algo"] &&
      h["paypal-cert-url"] &&
      h["paypal-transmission-id"] &&
      h["paypal-transmission-sig"] &&
      h["paypal-transmission-time"]
  );
}

/**
 * POST /api/pay/paypal/webhook
 * server.js mount ที่ "/api/pay/paypal/webhook" และใช้ express.raw() แล้ว
 * ดังนั้นที่นี่ใช้ path "/" เท่านั้น
 */
router.post("/", async (req, res) => {
  const isProd = (process.env.NODE_ENV || "development") === "production";

  try {
    const event = safeParsePaypalEvent(req);

    // body ไม่ใช่ JSON: ตอบ 200 เพื่อไม่ให้ PayPal retry รัว
    if (!event) {
      console.warn("⚠️ [PayPal] webhook: invalid JSON body (ignored)");
      return res.status(200).json({ ok: true, ignored: true, reason: "invalid_body" });
    }

    // ไม่ใช่ event จริง
    if (!event?.event_type) {
      console.warn("⚠️ [PayPal] webhook: missing event_type (ignored)");
      return res.status(200).json({ ok: true, ignored: true, reason: "no_event_type" });
    }

    const headersLower = lowerHeaders(req.headers);
    const hasSig = hasPaypalSignatureHeaders(headersLower);
    const hasWebhookId = !!process.env.PAYPAL_WEBHOOK_ID;

    // ===== Verify policy =====
    // - Dev: ถ้า headers ไม่ครบ -> skip verify (ทดสอบด้วย curl ได้)
    // - Prod: ถ้ามี webhook id แต่ headers ไม่ครบ -> 400
    if (hasWebhookId) {
      if (!hasSig) {
        if (isProd) {
          console.warn("⚠️ [PayPal] missing signature headers (reject in prod)");
          return res.status(400).json({ ok: false, message: "Missing PayPal signature headers" });
        } else {
          console.warn("⚠️ [PayPal] signature verify skipped (dev/manual; missing PayPal headers)");
        }
      } else {
        try {
          const verify = await verifyPaypalWebhookSignature({
            headers: headersLower,
            body: event,
          });

          if (verify?.ok && verify?.verification_status !== "SUCCESS") {
            console.warn("⚠️ [PayPal] webhook signature NOT success:", verify);
            return res.status(400).json({ ok: false, message: "Invalid signature" });
          }
        } catch (e) {
          // ถ้า verify API error:
          // - dev: skip แล้วรับ event ต่อ (กันพังเวลา sandbox เพี้ยน/ยิงเอง)
          // - prod: reject
          if (isProd) {
            console.error("❌ [PayPal] verify signature error (prod reject):", e?.message || e);
            return res.status(400).json({ ok: false, message: "Signature verification error" });
          }
          console.warn("⚠️ [PayPal] verify signature error (dev skipped):", e?.message || e);
        }
      }
    } else {
      console.warn("⚠️ [PayPal] PAYPAL_WEBHOOK_ID not set -> verify skipped");
    }

    // ===== Process event =====
    const eventType = event.event_type;
    const eventId = event.id;
    console.log("📩 [PayPal] webhook:", eventType, "id:", eventId);

    const resource = event.resource || {};
    const paypalOrderId =
      resource?.supplementary_data?.related_ids?.order_id || resource?.id;

    const order = paypalOrderId
      ? await Order.findOne({ paymentRef: paypalOrderId })
      : null;

    if (!order) {
      console.warn("⚠️ [PayPal] local order not found for paypalOrderId:", paypalOrderId);
      return res.status(200).json({ ok: true, ignored: true });
    }

    const isPaidEvent =
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      eventType === "CHECKOUT.ORDER.COMPLETED";

    if (!isPaidEvent) {
      return res.status(200).json({ ok: true, updated: false });
    }

    const paidValue = pickValidPaymentStatusValue(Order, "paid");
    if (paidValue) order.paymentStatus = paidValue;

    order.paymentMeta = {
      ...(order.paymentMeta || {}),
      paypalEventId: eventId,
      paypalEventType: eventType,
      paidAt: new Date(),
    };

    await order.save();

    const reward = await awardTokensForPaidOrder(order, { paypalEventId: eventId });
    console.log("🎁 [Token] reward result:", reward);

    return res.status(200).json({ ok: true, updated: true, reward });
  } catch (err) {
    console.error("❌ [PayPal] webhook error:", err);
    // ใน production แนะนำ 200 เพื่อไม่ให้ PayPal retry ถี่ (แต่ต้อง log/monitor)
    // ตอนนี้คง 500 ตามเดิมก่อน
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

export default router;
