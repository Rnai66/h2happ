import mongoose from "mongoose";
export function PaymentModel(conn) {
  const name = "Payment";
  if (conn.models[name]) return conn.models[name];
  const schema = new mongoose.Schema({
    orderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["cash", "card", "brocoin", "other"], default: "other" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    meta: { type: Object }
  }, { timestamps: true });
  return conn.model(name, schema);
}
