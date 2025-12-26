import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    itemId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    buyerId:  { type: mongoose.Schema.Types.ObjectId, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: true },

    // เดิมใช้ชื่อ price
    price:    { type: Number, required: true },

    method:   {
      type: String,
      enum: ["bank_transfer", "cash_meetup"], // ไว้ค่อยเพิ่ม "paypal" ได้
      required: true,
    },

    status: {
      type: String,
      enum: [
        "INITIATED",
        "PENDING_PAYMENT",
        "PAID_PENDING_VERIFY",
        "PAID_VERIFIED",
        "FULFILLED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "INITIATED",
    },

    slip: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },

    notes: String,
  },
  { timestamps: true }
);

// ⭐ กัน OverwriteModelError เวลา import โมเดลนี้หลายรอบ
const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;
