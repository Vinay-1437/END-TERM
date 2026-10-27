import express from "express";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/room.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Room routes
router.get("/rooms", protect, getRooms);
router.post("/rooms", protect, authorize("admin"), createRoom);
router.put("/rooms/:id", protect, authorize("admin"), updateRoom);
router.delete("/rooms/:id", protect, authorize("admin"), deleteRoom);

// Booking routes
router.get("/bookings", protect, getBookings);
router.post("/bookings", protect, createBooking);
router.put("/bookings/:id/status", protect, authorize("admin"), updateBookingStatus);
router.put("/bookings/:id/cancel", protect, cancelBooking);

export default router;
