import { Router } from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

/**
 * POST /api/token/reward
 * body: { amount?: number, reason?: string }
 */
router.post("/reward", auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount ?? 10);
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be greater than 0" });
    }

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.tokenBalance = (user.tokenBalance || 0) + amount;
    await user.save();

    res.json({
      ok: true,
      tokenBalance: user.tokenBalance,
      message: `Rewarded ${amount} tokens.`,
    });
  } catch (err) {
    console.error("reward error:", err);
    res
      .status(500)
      .json({ message: "Reward token failed", error: err.message });
  }
});

export default router;
