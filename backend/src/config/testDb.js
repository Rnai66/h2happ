import "dotenv/config.js";
import { connectDB } from "./db.js";

(async () => {
  try {
    await connectDB();
    process.exit(0);
  } catch (e) {
    console.error("DB connect failed:", e);
    process.exit(1);
  }
})();

