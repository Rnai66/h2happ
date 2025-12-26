import mongoose from "mongoose";
export function TokenModel(conn) {
  const name = "Token";
  if (conn.models[name]) return conn.models[name];
  const schema = new mongoose.Schema({
    address: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    balance: { type: Number, default: 0 },
    chain: { type: String, default: "BSC", index: true },
    note: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  }, { timestamps: true });
  return conn.model(name, schema);
}
