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
    // 🟢 DEBUG: Log and Allow ALL origins
    console.log(`[CORS] Request from origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};
