import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { UserModel } from "../models/User.js";

const router = Router();

// DB Connection
function getUserModel() {
  const conn = getConnection(DBNAMES.USER);
  return UserModel(conn);
}

function signToken(user) {
  return jwt.sign(
    {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * POST /api/auth/register
 * body: { name, email, password }
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "กรุณากรอก name, email, password ให้ครบ" });
    }

    const User = getUserModel();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "กรุณากรอก email และ password" });
    }

    const User = getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/profile
 * header: Authorization: Bearer <token>
 */
router.get("/profile", auth, (req, res) => {
  // auth middleware ควร set req.user จาก jwt.decode
  res.json({ user: req.user });
});

// ✅ Temporary: Fix Admin Access (Promote the Caller)
router.post("/promote-me", auth, async (req, res, next) => {
  try {
    const User = getUserModel();
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role: "admin" },
      { new: true }
    );
    // Return new token
    const token = signToken(user);
    res.json({ message: "You are now Admin", user, token });
  } catch (err) {
    next(err);
  }
});

export default router;
