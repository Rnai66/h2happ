// src/models/PaymentModel.js
import mongoose from "mongoose";

export function PaymentModel(conn) {
  const name = "Payment";
  if (conn.models[name]) return conn.models[name];

  const schema = new mongoose.Schema(
    {
      orderId: { type: String, required: true, index: true },
      itemId: { type: String, required: true, index: true },
      buyerId: { type: String, required: true, index: true },
      sellerId: { type: String, required: true, index: true },

      amount: { type: Number, required: true },
      currency: { type: String, default: "THB" },

      // ช่องทางการจ่ายเงิน
      method: {
        type: String,
        enum: ["cash", "transfer", "promptpay", "card", "paypal"],
        default: "cash",
        index: true,
      },

      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        index: true,
      },

      paidAt: { type: Date, default: null },

      // สลิปการโอน: URL หรือ path กับไฟล์รูป
      slipImageUrl: { type: String, default: "" },

      // PayPal metadata
      paypalOrderId: { type: String, default: "" },
      paypalCaptureId: { type: String, default: "" },

      // Token reward flags (ใช้ให้ Admin เห็น / ป้องกันแจกซ้ำ)
      buyerTokenRewarded: { type: Boolean, default: false },
      sellerTokenRewarded: { type: Boolean, default: false },
    },
    { timestamps: true }
  );

  return conn.model(name, schema);
}
