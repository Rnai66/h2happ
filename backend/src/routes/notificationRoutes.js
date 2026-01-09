import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications - Get all my notifications
router.get("/", auth, async (req, res, next) => {
    try {
        const userId = req.user._id;
        // Limit to last 50
        const notes = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Count unread
        const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

        res.json({ ok: true, notifications: notes, unreadCount });
    } catch (e) {
        next(e);
    }
});

// PATCH /api/notifications/:id/read - Mark one as read
router.patch("/:id/read", auth, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const note = await Notification.findOneAndUpdate(
            { _id: id, recipientId: userId },
            { isRead: true },
            { new: true }
        );

        if (!note) {
            return res.status(404).json({ ok: false, error: "Not found" });
        }
        res.json({ ok: true, notification: note });
    } catch (e) {
        next(e);
    }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch("/read-all", auth, async (req, res, next) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );
        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
});

export default router;
