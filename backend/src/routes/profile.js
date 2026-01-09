// backend/src/routes/profile.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/profile/me
router.get("/me", auth, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

    // Support various user id locations
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const balance = Number.isFinite(user.tokenBalance) ? user.tokenBalance : 0;

    return res.json({
      user,
      tokenBalance: balance,
    });
  } catch (err) {
    console.error("profile/me error:", err);
    return res.status(500).json({ message: "Failed to load profile", error: err.message });
  }
});

// PUT /api/profile - Update profile info
router.put("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { name, phone, address, avatar, notifications } = req.body;

    const update = {};
    if (name) update.name = name.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (address !== undefined) update.address = address.trim();
    if (avatar !== undefined) update.avatar = avatar;
    if (notifications) update.notifications = notifications;

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select("-passwordHash");

    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// PATCH /api/profile/password - Change password
router.patch("/password", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check current password (if user has one set)
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
});

export default router;
