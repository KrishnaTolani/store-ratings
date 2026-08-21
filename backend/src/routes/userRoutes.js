import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(requireAuth, requireRole("USER"));

router.get("/stores", asyncHandler(userController.getStores));
router.get("/stores/:storeId", asyncHandler(userController.getStoreById));
router.post("/stores/:storeId/ratings", asyncHandler(userController.submitRating));
router.put("/stores/:storeId/ratings", asyncHandler(userController.updateRating));

export default router;
