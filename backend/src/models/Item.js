// backend/src/models/Item.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 0 },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    images: { type: [String], default: [] },
    category: { type: String, default: "" },
    condition: { type: String, default: "good" },

    // ✅ รองรับ draft ตาม Phase 1
    status: {
      type: String,
      enum: ["draft", "active", "reserved", "sold", "hidden"],
      default: "draft",
      index: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerName: { type: String, required: true, trim: true },

    // Soft delete (เผื่อไว้)
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
