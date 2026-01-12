// backend/src/middleware/cors.js
import cors from "cors";

function buildAllowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const defaults = ["http://localhost:5173"];
  return Array.from(new Set([...defaults, ...fromEnv]));
}

const allowedOrigins = buildAllowedOrigins();

export const corsOptions = {
  origin(origin, callback) {
    // 🟢 DEBUG: Allow ALL origins for Android testing
    return callback(null, true);

    // if (!origin) return callback(null, true);
    // const ok =
    //   allowedOrigins.includes(origin) ||
    //   origin.endsWith(".vercel.app");
    // if (ok) return callback(null, true);
    // console.log("❌ CORS blocked:", origin, "Allowed:", allowedOrigins);
    // return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};
