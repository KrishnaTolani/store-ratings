import { Router } from "express";
import * as ownerController from "../controllers/ownerController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(requireAuth, requireRole("OWNER"));

router.get("/dashboard", asyncHandler(ownerController.getDashboard));

export default router;
