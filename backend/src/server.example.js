import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { corsMiddleware } from "./middleware/cors.js";

// Existing app-level routes to import
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(corsMiddleware());
app.use(morgan("dev"));

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

// 404 & error
app.use(notFound);
app.use(errorHandler);

// Boot
const PORT = process.env.PORT || 4000;
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => logger.info(`API on :${PORT}`));
  } catch (err) {
    logger.error(err, "Boot error");
    process.exit(1);
  }
};
start();

export default app;
