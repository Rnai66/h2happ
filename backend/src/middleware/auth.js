import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: payload._id, name: payload.name, role: payload.role || "user" };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
