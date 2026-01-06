import mongoose from "mongoose";

const TokenBalanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
    balance: { type: Number, default: 0 },
    symbol: { type: String, default: process.env.TOKEN_SYMBOL || "BROC" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.TokenBalance ||
  mongoose.model("TokenBalance", TokenBalanceSchema);
