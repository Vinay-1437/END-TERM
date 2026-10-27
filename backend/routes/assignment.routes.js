import express from "express";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateMyStatus,
} from "../controllers/assignment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getAssignments);
router.post("/", protect, authorize("faculty", "admin"), createAssignment);
router.put("/:id", protect, authorize("faculty", "admin"), updateAssignment);
router.delete("/:id", protect, authorize("faculty", "admin"), deleteAssignment);

// Students mark their own assignment status
router.put("/:id/status", protect, authorize("student"), updateMyStatus);

export default router;
