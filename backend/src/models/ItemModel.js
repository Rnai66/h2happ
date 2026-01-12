// src/models/ItemModel.js
import mongoose from "mongoose";

export function ItemModel(conn) {
  const name = "Item";
  if (conn.models[name]) return conn.models[name];

  const schema = new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      quantity: { type: Number, default: 1, min: 0 },
      description: { type: String, trim: true, default: "" },

      images: [{ type: String, default: "" }],

      sellerId: { type: String, required: true, index: true },

      // ✅ เพิ่ม draft + reserved ให้ครบ Phase 1
      status: {
        type: String,
        enum: ["draft", "active", "reserved", "sold", "hidden"],
        default: "draft",
        index: true,
      },

      isDeleted: { type: Boolean, default: false, index: true },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

  schema.index({ title: "text", description: "text" });

  return conn.model(name, schema);
}
