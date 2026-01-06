import mongoose from "mongoose";

export function ProfileModel(conn) {
  const name = "Profile";
  if (conn.models[name]) return conn.models[name];

  const schema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 2000 },
    avatarUrl: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: {
      line1: String, line2: String, city: String, state: String,
      postalCode: String, country: String
    },
    socials: {
      facebook: String, twitter: String, instagram: String, github: String, website: String
    }
  }, { timestamps: true });

  schema.index({ displayName: "text", bio: "text" });

  return conn.model(name, schema);
}
