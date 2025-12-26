import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { ProfileModel } from "../models/Profile.js";
import { protect, authorize } from "../middleware/auth.js";
import { parsePaging } from "../helpers/pagination.js";

const router = Router();

router.get("/me", protect, async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);
    let p = await Profile.findOne({ userId: req.user.id });
    if (!p) p = await Profile.create({ userId: req.user.id });
    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Get my profile failed", error: e.message });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);
    const allowed = ["displayName","bio","avatarUrl","phone","address","socials"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const p = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Update my profile failed", error: e.message });
  }
});

// ----- Admin only -----
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req);
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);
    const [rows, total] = await Promise.all([
      Profile.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Profile.countDocuments()
    ]);
    res.json({ page, limit, total, profiles: rows });
  } catch (e) {
    res.status(500).json({ message: "List profiles failed", error: e.message });
  }
});

router.get("/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);
    const p = await Profile.findOne({ userId: req.params.userId });
    if (!p) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Get profile failed", error: e.message });
  }
});

router.delete("/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);
    const r = await Profile.findOneAndDelete({ userId: req.params.userId });
    if (!r) return res.status(404).json({ message: "Profile not found" });
    res.json({ message: "Profile deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete profile failed", error: e.message });
  }
});

export default router;
