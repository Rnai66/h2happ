// src/models/ProfileModel.js
import mongoose from "mongoose";

export function ProfileModel(conn) {
  const name = "Profile";
  if (conn.models[name]) return conn.models[name];

  const schema = new mongoose.Schema(
    {
      // อ้างอิงไปที่ user._id (String)
      userId: { type: String, required: true, unique: true, index: true },

      // ข้อมูลโปรไฟล์อื่น ๆ (เผื่อใช้แสดงหน้า /profile/me)
      name: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },

      // 🎟 ยอด token ที่มีตอนนี้
      tokenBalance: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  return conn.model(name, schema);
}
