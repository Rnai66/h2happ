import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, default: "" },
  attachments: [{ url: String, type: String, size: Number }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
export default ChatMessage;
