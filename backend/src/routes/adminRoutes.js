import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", asyncHandler(adminController.getDashboardStats));
router.get("/users", asyncHandler(adminController.getUsers));
router.get("/users/:id", asyncHandler(adminController.getUserById));
router.post("/users", asyncHandler(adminController.createUser));
router.get("/stores", asyncHandler(adminController.getStores));
router.get("/owners", asyncHandler(adminController.getOwners));
router.post("/stores", asyncHandler(adminController.createStore));

export default router;
