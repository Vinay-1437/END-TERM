import express from "express";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getAnnouncements);
router.get("/:id", protect, getAnnouncementById);
router.post("/", protect, authorize("faculty", "admin"), createAnnouncement);
router.put("/:id", protect, authorize("faculty", "admin"), updateAnnouncement);
router.delete("/:id", protect, authorize("faculty", "admin"), deleteAnnouncement);

export default router;
