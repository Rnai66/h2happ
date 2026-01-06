// src/models/OrderModel.js
import mongoose from "mongoose";

export function OrderModel(conn) {
  const name = "Order";
  if (conn.models[name]) return conn.models[name];

  const schema = new mongoose.Schema(
    {
      orderNumber: { type: String, required: true, unique: true },

      itemId: { type: String, required: true, index: true },
      buyerId: { type: String, required: true, index: true },
      sellerId: { type: String, required: true, index: true },

      // snapshot ข้อมูลตอนสร้าง order (กันกรณีสินค้าเปลี่ยนราคา)
      itemSnapshot: {
        title: String,
        price: Number,
        images: [String],
      },

      amount: { type: Number, required: true },
      currency: { type: String, default: "THB" },

      status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending",
        index: true,
      },

      paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
        index: true,
      },

      // soft delete
      isDeleted: { type: Boolean, default: false, index: true },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

  return conn.model(name, schema);
}
