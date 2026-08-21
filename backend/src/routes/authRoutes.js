import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/login", asyncHandler(authController.login));
router.post("/signup", asyncHandler(authController.signup));
router.get("/me", requireAuth, asyncHandler(authController.me));
router.post("/update-password", requireAuth, asyncHandler(authController.updatePassword));

export default router;
