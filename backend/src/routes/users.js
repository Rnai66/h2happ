import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { UserModel } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import { parsePaging as _parsePaging } from "../helpers/pagination.js";
import mongoose from "mongoose";

const router = Router();

/* ------------ helpers ------------- */

// parsePaging (fallback ถ้า project ไม่มี helper)
function parsePaging(req) {
  if (typeof _parsePaging === "function") return _parsePaging(req);
  const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const skip = (page - 1) * limit;
  // รองรับ sort param เช่น -createdAt หรือ email
  const sortParam = typeof req.query.sort === "string" ? req.query.sort : "-createdAt";
  const sort = sortParam.startsWith("-")
    ? { [sortParam.slice(1)]: -1 }
    : { [sortParam]: 1 };
  return { page, limit, skip, sort };
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id || "");

/* ------------ GET /api/users (admin only) ------------- */
/**
 * Query:
 *  - q: keyword ค้นหาใน name/email (regex, case-insensitive)
 *  - role: "admin" | "user"
 *  - sort: เช่น "-createdAt" | "email"
 *  - page, limit
 */
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip, sort } = parsePaging(req);
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const filter = {};
    const { q, role } = req.query;
    if (q) {
      const kw = String(q).trim();
      filter.$or = [
        { name: { $regex: kw, $options: "i" } },
        { email: { $regex: kw, $options: "i" } },
      ];
    }
    if (role === "admin" || role === "user") {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ page, limit, total, users });
  } catch (e) {
    res.status(500).json({ message: "Failed to list users", error: e.message });
  }
});

/* ------------ POST /api/users (admin only) ------------- */
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    email = String(email).trim().toLowerCase();
    role = role === "admin" ? "admin" : "user";

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email,
      password: hash,
      role,
    });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Failed to create user", error: e.message });
  }
});

/* ------------ GET /api/users/:id (admin or owner) ------------- */
router.get("/:id", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isOwner = String(req.user.id) === String(user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Failed to get user", error: e.message });
  }
});

/* ------------ PUT /api/users/:id (admin only) ------------- */
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const { name, email, role } = req.body;
    const update = {};

    if (name) update.name = String(name).trim();
    if (email) update.email = String(email).trim().toLowerCase();
    if (role) {
      if (role !== "admin" && role !== "user") {
        return res.status(400).json({ message: "Invalid role" });
      }
      update.role = role;
    }

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    if (update.email) {
      const dup = await User.findOne({ email: update.email, _id: { $ne: req.params.id } });
      if (dup) return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Failed to update user", error: e.message });
  }
});

/* ------------ PATCH /api/users/:id/role (admin only) ------------- */
router.patch("/:id/role", protect, authorize("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const { role } = req.body;
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Failed to update role", error: e.message });
  }
});

/* ------------ PATCH /api/users/:id/password ------------- */
/**
 * - เจ้าของบัญชี: ต้องส่ง { currentPassword, newPassword }
 * - แอดมิน: ส่ง { newPassword } ก็พอ (ไม่ต้อง currentPassword)
 */
router.patch("/:id/password", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isOwner = String(req.user.id) === String(user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (isOwner && !isAdmin) {
      // เจ้าของต้องยืนยันรหัสผ่านเดิม
      const ok = await bcrypt.compare(String(currentPassword || ""), String(user.password || ""));
      if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    user.password = hash;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (e) {
    res.status(500).json({ message: "Failed to update password", error: e.message });
  }
});

/* ------------ DELETE /api/users/:id (admin only) ------------- */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);
    const r = await User.findByIdAndDelete(req.params.id);

    if (!r) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete user", error: e.message });
  }
});

export default router;
