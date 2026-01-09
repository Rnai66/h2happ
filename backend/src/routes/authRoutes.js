
import { Router } from "express";
import { register, login, getProfile, googleLogin } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin); // 🆕 Google Route
router.get("/profile", protect, getProfile);

export default router;
