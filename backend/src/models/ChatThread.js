import mongoose from "mongoose";

const ChatThreadSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

ChatThreadSchema.index({ itemId: 1, buyerId: 1, sellerId: 1 }, { unique: true });

const ChatThread = mongoose.model("ChatThread", ChatThreadSchema);
export default ChatThread;
