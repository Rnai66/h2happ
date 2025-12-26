// backend/src/routes/profile.js
import { Router } from "express";
import auth from "../middleware/auth.js"; // default export
import User from "../models/User.js";

const router = Router();

/**
 * GET /api/profile/me
 * - ต้อง login
 * - กัน browser cache (304) เพื่อไม่ให้หน้า Profile ว่าง
 */
router.get("/me", auth, async (req, res) => {
  try {
    // ✅ กัน cache/304 สำหรับข้อมูลส่วนตัว
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // ✅ รองรับหลายรูปแบบของ auth middleware
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?._id?.toString?.() ||
      null;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-passwordHash -password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const balance = Number.isFinite(user.tokenBalance) ? user.tokenBalance : 0;

    return res.json({
      user,
      tokenBalance: balance,
    });
  } catch (err) {
    console.error("profile/me error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load profile", error: err.message });
  }
});

export default router;
