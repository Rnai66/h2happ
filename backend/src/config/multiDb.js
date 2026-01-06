// src/config/multiDb.js
import mongoose from "mongoose";

const connections = {};

export function getDbConnection(dbNameEnvKey) {
  const dbName = process.env[dbNameEnvKey]; // เช่น "DB_ITEM" -> "item_db"
  if (!dbName) {
    throw new Error(`Missing env for DB name: ${dbNameEnvKey}`);
  }

  if (connections[dbName]) {
    return connections[dbName];
  }

  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error("MONGO_URI is not set");
  }

  const uri = `${baseUri}${dbName}?retryWrites=true&w=majority`;
  const conn = mongoose.createConnection(uri);

  conn.on("connected", () => {
    console.log(`✅ [DB] connected: ${dbName}`);
  });

  conn.on("error", (err) => {
    console.error(`❌ [DB] error on ${dbName}`, err);
  });

  connections[dbName] = conn;
  return conn;
}
