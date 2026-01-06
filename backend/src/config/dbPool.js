import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const required = ["MONGO_USER", "MONGO_PASS", "MONGO_CLUSTER"];
for (const k of required) {
  if (!process.env[k] || String(process.env[k]).trim() === "") {
    throw new Error(`[ENV] Missing ${k}. Please set it in backend/.env`);
  }
}

const BASE = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}`;
const cache = new Map();

export function uriFor(dbName) {
  if (!dbName) throw new Error("dbName is required");
  return `${BASE}/${dbName}?retryWrites=true&w=majority`;
}

export function getConnection(dbName) {
  if (cache.has(dbName)) return cache.get(dbName);
  const conn = mongoose.createConnection(uriFor(dbName));
  conn.on("connected", () => console.log(`✅ [DB] connected: ${dbName}`));
  conn.on("error", (err) => console.error(`❌ [DB] error (${dbName}):`, err.message));
  cache.set(dbName, conn);
  return conn;
}

export const DBNAMES = {
  USER: process.env.DB_USER || "user_db",
  ITEM: process.env.DB_ITEM || "item_db",
  PAYMENT: process.env.DB_PAYMENT || "payment_db",
  TOKEN: process.env.DB_TOKEN || "token_db",
  PROFILE: process.env.DB_PROFILE || "profile_db",
};
