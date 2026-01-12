// backend/src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import { User } from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import crypto from "crypto";

const router = Router();

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
 * POST /api/auth/google
 * body: { token }
 */
router.post("/google", async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify Google Token (Access Token approach)
    // Frontend sends 'access_token' from useGoogleLogin()
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return res.status(400).json({ message: "Invalid Google Token" });
    }

    const data = await response.json();
    const { email, name, sub: googleId, picture } = data;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Register new user
      user = await User.create({
        name: name || "Google User",
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role: "user",
        // random password just in case
        passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10)
      });

      // Give welcome reward
      // ... (Handled by frontend calling /token/reward or separate logic. 
      // Current frontend logic seems to rely on explicit Register call for reward.
      // We can AUTO-REWARD here if desired, but let's stick to basic login first.)
    } else {
      // Update existing user info if needed
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const appToken = signToken(user);

    res.json({
      token: appToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        tokenBalance: user.tokenBalance
      },
      message: "Google Login Successful"
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

/**
 * POST /api/auth/forgot-password
 * body: { email }
 */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    // รับได้ทั้ง email หรือ phone (ส่งมาใน key "email" ก็ได้ หรือแยก key ก็ได้ แต่ frontend มักจะส่งเป็น field เดียว)
    // เพื่อความง่าย ให้ frontend ส่งมาเป็น identifier ก็ได้ หรือ check ทั้งคู่
    const identifier = email || phone;

    if (!identifier) return res.status(400).json({ message: "กรุณาระบุอีเมลหรือเบอร์โทรศัพท์" });

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return res.json({ ok: true, message: "หากข้อมูลถูกต้อง ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Construct reset URL
    const clientBase = process.env.CLIENT_BASE_URL || "http://localhost:5173";
    const resetUrl = `${clientBase}/auth/reset-password?token=${token}`;

    // Decide whether to send Email or Mock SMS
    // ✅ Logic Update: Even if user provided phone, we send to their EMAIL.
    // Because we don't have SMS Gateway.

    const message = `
      <h1>รีเซ็ตรหัสผ่าน</h1>
      <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี H2H Thailand</p>
      <p><b>กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</b></p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
      <hr />
      <p style="font-size: 12px; color: #666;">หากคุณไม่ได้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลนี้</p>
    `;

    // Always send to user.email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - H2H Thailand",
      html: message,
      text: `Reset password link: ${resetUrl}`,
    });

    // If identifier was phone, log it specifically
    if (!identifier.includes("@")) {
      console.log(`📱 [Info] User requested reset via Phone (${user.phone}). Sent link to Email (${user.email}).`);
    }

    return res.json({
      ok: true,
      message: identifier.includes("@")
        ? "ส่งลิงก์ทางอีเมลแล้ว"
        : `ระบบพบข้อมูลเบอร์โทรศัพท์ และได้ส่งลิงก์รีเซ็ตไปที่อีเมล: ${maskEmail(user.email)} แล้ว`
    });

  } catch (err) {
    next(err);
  }
});

// Helper to mask email (e.g. n***@gmail.com)
function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name[0]}***@${domain}`;
}


/**
 * POST /api/auth/reset-password
 * body: { token, password }
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "ลิงก์หมดอายุหรือไม่ถูกต้อง" });
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ ok: true, message: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่" });
  } catch (err) {
    next(err);
  }
});

export default router;
