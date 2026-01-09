
import { Router } from "express";
import protect from "../middleware/auth.js";
import { getStats } from "../controllers/dashboardController.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", protect, getStats);

export default router;
