/**
 * DEBUG SCRIPT: Clear all trading data
 * DBs:
 *  - payment_db
 *  - token_db
 *
 * ❌ Does NOT touch:
 *  - user_db
 *  - item_db
 *  - profile_db
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

const DBS = {
  payment_db: [
    "orders",
    "payments",
    "transactions",
    "slips",
    "receipts",
    "invoices",
    "orderEvents",
    "paymentEvents",
    "webhookEvents",
    "logs",
  ],
  token_db: [
    "tokenTx",
    "tokenTransactions",
    "transactions",
    "ledger",
    "walletLogs",
    "rewardLogs",
  ],
};

async function run() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();

  for (const [dbName, collections] of Object.entries(DBS)) {
    const db = conn.useDb(dbName);
    const existing = await db.db.listCollections().toArray();
    const names = existing.map((c) => c.name);

    console.log(`\n📦 DB: ${dbName}`);
    console.log("collections:", names);

    for (const col of collections) {
      if (names.includes(col)) {
        const res = await db.collection(col).deleteMany({});
        console.log(`🧹 ${dbName}.${col}: deleted ${res.deletedCount}`);
      }
    }
  }

  await conn.close();
  console.log("\n✅ Trading data cleared");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});

