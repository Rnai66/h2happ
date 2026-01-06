// backend/src/models/User.js
import mongoose from "mongoose";

export function UserModel(conn) {
  const name = "User";
  if (conn.models[name]) return conn.models[name];

  const userSchema = new mongoose.Schema(
    {
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
        type: String, // Keep legacy field just in case
        required: false,
      },
      password: { // Add standard password field to match other code
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ["user", "seller", "admin", "moderator"],
        default: "user",
      },
      permissions: {
        type: [String],
        default: [],
      },
      tokenBalance: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true }
  );

  return conn.model(name, userSchema);
}

// Fallback for default connection if needed, but prefer factory
// export const User = mongoose.model("User", userSchema); 
// Removing default global model to force using factory
export default UserModel;
