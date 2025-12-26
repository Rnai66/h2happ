import mongoose from "mongoose";

const DEFAULT_OPTS = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI missing");
  let attempts = 0;
  const maxAttempts = Number(process.env.DB_MAX_ATTEMPTS || 10);
  const delay = Number(process.env.DB_RETRY_DELAY_MS || 3000);

  while (true) {
    try {
      attempts += 1;
      await mongoose.connect(uri, DEFAULT_OPTS);
      console.log("[db] connected", mongoose.connection.name);
      mongoose.connection.on("error", (err) => console.error("[db] error", err));
      mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
      return mongoose;
    } catch (err) {
      console.error(`[db] connect error (attempt ${attempts}/${maxAttempts})`, err.message);
      if (attempts >= maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
