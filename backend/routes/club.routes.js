import express from "express";
import {
  getClubs,
  createClub,
  updateClub,
  joinClub,
  leaveClub,
  getEvents,
  createEvent,
  updateEvent,
  registerForEvent,
  cancelEventRegistration,
} from "../controllers/club.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Club routes
router.get("/clubs", protect, getClubs);
router.post("/clubs", protect, authorize("admin"), createClub);
router.put("/clubs/:id", protect, authorize("admin"), updateClub);
router.post("/clubs/:id/join", protect, authorize("student"), joinClub);
router.delete("/clubs/:id/leave", protect, authorize("student"), leaveClub);

// Event routes
router.get("/events", protect, getEvents);
router.post("/events", protect, authorize("faculty", "admin"), createEvent);
router.put("/events/:id", protect, authorize("faculty", "admin"), updateEvent);
router.post("/events/:id/register", protect, registerForEvent);
router.delete("/events/:id/cancel-registration", protect, cancelEventRegistration);

export default router;
