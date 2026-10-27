import express from "express";
import {
  getProfile,
  searchDirectory,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/directory", protect, searchDirectory);

// Admin-only routes
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);
router.put("/:id/toggle-active", protect, authorize("admin"), toggleUserActive);

export default router;
