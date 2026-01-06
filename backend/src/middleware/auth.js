import jwt from "jsonwebtoken";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { UserModel } from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user to get latest role/permissions
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);
    const user = await User.findById(payload._id).select("name role permissions");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      _id: user._id,
      id: user._id, // alias for convenience
      name: user.name,
      role: user.role || "user",
      permissions: user.permissions || []
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Middleware to require specific roles
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
    }
    next();
  };
}

// Middleware to require specific permission (AD-style)
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // Admins always have access
    if (req.user.role === 'admin') return next();

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({ message: `Forbidden: Requires ${permission} permission` });
    }
    next();
  };
}
