import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// Liveness — แอปยังมีชีวิต (ตอบไว)
router.get("/live", (_req, res) => {
  res.json({ ok: true, service: "H2H API", ts: new Date().toISOString() });
});

// Readiness — พร้อมรับงาน (DB พร้อมด้วย)
router.get("/ready", (_req, res) => {
  const dbReady =
    mongoose.connection?.readyState === 1 || // connected
    mongoose.connections?.some(c => c.readyState === 1);

  if (!dbReady) {
    return res.status(503).json({ ok: false, db: "not_ready" });
  }
  res.json({ ok: true, db: "ready", ts: new Date().toISOString() });
});

// Default
router.get("/", (_req, res) => {
  res.json({ ok: true, message: "health ok" });
});

export default router;
