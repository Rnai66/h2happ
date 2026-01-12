// backend/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false, // 🟢 Optional for Google Login
  },
  googleId: {
    type: String, // 🆕 Google ID
    unique: true,
    sparse: true,
  },
  avatar: {
    type: String, // 🆕 Profile picture
  },
  role: {
    type: String,
    enum: ["user", "seller", "admin"],
    default: "user",
  },

  // 🆕 สำคัญ: Token reward
  tokenBalance: {
    type: Number,
    default: 0,
  },

  // 🆕 Profile Settings
  address: { type: String, default: "" },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },

  // 🆕 เบอร์โทรศัพท์ (สำหรับติดต่อผู้ขาย)
  phone: {
    type: String,
    required: false,
    trim: true,
  },

  // 🆕 Forgot Password fields
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
},
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export { userSchema };
export default User;
