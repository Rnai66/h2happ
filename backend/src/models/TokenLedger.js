import mongoose from "mongoose";

const TokenLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, index: true },
    amount: { type: Number, required: true },
    symbol: { type: String, default: process.env.TOKEN_SYMBOL || "BROC" },
    type: { type: String, enum: ["reward", "adjust", "refund"], default: "reward" },
    reason: { type: String, default: "purchase_reward" },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.TokenLedger ||
  mongoose.model("TokenLedger", TokenLedgerSchema);
