import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { TokenModel } from "../models/Token.js";
import { protect, authorize, ownerOrAdmin } from "../middleware/auth.js";
import { parsePaging } from "../helpers/pagination.js";
import { tokenCreateSchema, tokenUpdateSchema } from "../validation/tokens.js";

const router = Router();

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req);
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const [tokens, total] = await Promise.all([
      Token.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Token.countDocuments({ isDeleted: { $ne: true } })
    ]);
    res.json({ page, limit, total, tokens });
  } catch (e) {
    res.status(500).json({ message: "Failed to list tokens", error: e.message });
  }
});

router.get("/:id", protect, ownerOrAdmin(async (req) => {
  const conn = getConnection(DBNAMES.TOKEN);
  const Token = TokenModel(conn);
  const t = await Token.findById(req.params.id);
  return t?.ownerId;
}), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const token = await Token.findById(req.params.id);
    if (!token || token.isDeleted) return res.status(404).json({ message: "Token not found" });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ message: "Failed to get token", error: e.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const parse = tokenCreateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ message: "Invalid payload", issues: parse.error.issues });
    if (String(parse.data.ownerId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "ownerId must match your user id unless admin" });
    }
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.create(parse.data);
    res.status(201).json({ token: t });
  } catch (e) {
    res.status(500).json({ message: "Failed to create token", error: e.message });
  }
});

router.put("/:id", protect, ownerOrAdmin(async (req) => {
  const conn = getConnection(DBNAMES.TOKEN);
  const Token = TokenModel(conn);
  const t = await Token.findById(req.params.id);
  return t?.ownerId;
}), async (req, res) => {
  try {
    const parse = tokenUpdateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ message: "Invalid payload", issues: parse.error.issues });
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const update = { ...parse.data };
    if (update.isDeleted === true) update.deletedAt = new Date();
    else if (update.isDeleted === false) update.deletedAt = null;
    const t = await Token.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!t) return res.status(404).json({ message: "Token not found" });
    res.json({ token: t });
  } catch (e) {
    res.status(500).json({ message: "Failed to update token", error: e.message });
  }
});

router.delete("/:id", protect, ownerOrAdmin(async (req) => {
  const conn = getConnection(DBNAMES.TOKEN);
  const Token = TokenModel(conn);
  const t = await Token.findById(req.params.id);
  return t?.ownerId;
}), async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!t) return res.status(404).json({ message: "Token not found" });
    res.json({ message: "Token soft-deleted", token: t });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete token", error: e.message });
  }
});

export default router;
