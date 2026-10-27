import express from "express";
import { getStudentDashboard, getAdminDashboard } from "../controllers/dashboard.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/student", protect, authorize("student"), getStudentDashboard);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

export default router;
