import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { UserModel } from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hash, role: "user" });

    const token = signToken(user);
    return res.status(201).json({
      message: "✅ Register success",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: "Register failed", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email, password are required" });
    }
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.json({
      message: "✅ Login success",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Get profile failed", error: err.message });
  }
}

export async function promoteToAdmin(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);
    const updated = await User.findByIdAndUpdate(userId, { role: "admin" }, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Role updated to admin", user: { id: updated._id, email: updated.email, role: updated.role } });
  } catch (err) {
    return res.status(500).json({ message: "Promote failed", error: err.message });
  }
}
