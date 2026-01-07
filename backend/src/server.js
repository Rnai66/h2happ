import express from "express";
import "dotenv/config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import chatRoutes from "./routes/chatRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import itemRoutes from "./routes/item.routes.js";
import { corsOptions } from "./middleware/cors.js";

import profileRoutes from "./routes/profile.js";
import tokenRewardRoutes from "./routes/tokenReward.js";

import payRoutes from "./routes/pay.js";
import paypalRoutes from "./routes/paypal.js";
import paypalWebhookRoutes from "./routes/paypalWebhook.js";
import uploadRoutes from "./routes/upload.js";
import aiRoutes from "./routes/ai.js";
import socialAuthRoutes from "./routes/socialAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== Base middlewares =====
app.use(cors(corsOptions));
app.use(cookieParser());
app.use("/api/upload", uploadRoutes);


// ===== PayPal Webhook (RAW) =====
// ⚠️ Webhook ต้องใช้ raw body และต้องมาก่อน express.json()
app.use("/api/pay/paypal/webhook", express.raw({ type: "application/json" }));
app.use("/api/pay/paypal/webhook", paypalWebhookRoutes);

// ===== JSON parsing for normal APIs =====
app.use(express.json());
app.use(morgan("dev"));

// Static uploads (local)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Root health
app.get("/", (_req, res) => res.json({ message: "H2H API is running" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// ===== Routes =====

// PayPal API (create/capture etc.)
app.use("/api/pay/paypal", paypalRoutes);

// Health / Auth / Chat
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth/social", socialAuthRoutes);
app.use("/api/users", usersRoutes); // Added users routes
app.use("/api/chat", chatRoutes);

// Orders / Items
app.use("/api/orders", orderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/ai", aiRoutes);

// pay routes รวม (PromptPay / โอนธนาคาร ฯลฯ)
app.use("/api/pay", payRoutes);

// profile + token
app.use("/api/profile", profileRoutes);
app.use("/api/token", tokenRewardRoutes);

// Redirect old /items → /api/items
app.get("/items", (req, res) => {
  const query = req.url.split("?")[1] || "";
  const target = "/api/items" + (query ? "?" + query : "");
  return res.redirect(302, target);
});

// 404
app.use((req, res) => res.status(404).json({ message: "Not Found" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err?.stack || err?.message || err);
  if (err?.message === "Invalid file type") {
    return res.status(400).json({
      error: "Invalid file type. Allowed: png, jpeg, webp, pdf",
    });
  }
  return res.status(500).json({ error: err?.message || "Server error" });
});

// Boot server
const PORT = process.env.PORT || 4010;
connectDB().then(() => {
  const server = app.listen(PORT, () =>
    console.log(`🚀 H2H Backend running on port ${PORT}`)
  );

  // Graceful shutdown
  const shutdown = () => {
    console.log("🛑 SIGTERM/SIGINT received. Closing server...");
    server.close(() => {
      console.log("✅ Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});

// Logs (optional)
console.log("🌍 [PayPal] CLIENT_BASE_URL =", process.env.CLIENT_BASE_URL);
console.log("🌐 [PayPal] BASE =", process.env.PAYPAL_BASE_URL);
console.log("🔍 [PayPal] CLIENT_ID set?", !!process.env.PAYPAL_CLIENT_ID);
console.log(
  "🔍 [PayPal] SECRET set?",
  !!(process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET)
);
