import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional (system msg might not have sender)
    type: {
        type: String,
        enum: ["CHAT", "ORDER_BUY", "ORDER_SELL", "SYSTEM"],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" }, // URL to redirect
    isRead: { type: Boolean, default: false },
    refId: { type: mongoose.Schema.Types.ObjectId }, // generic ref (orderId, threadId)
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.model("Notification", NotificationSchema);
