import Room from "../models/room.model.js";
import Booking from "../models/booking.model.js";
import Notification from "../models/notification.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { sendNotification } from "../utils/helpers.js";

// ── Room Management ──────────────────────────────────────────────────────────

// GET /api/rooms
export const getRooms = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = {};
  if (type) filter.type = type;

  const rooms = await Room.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, rooms });
});

// POST /api/rooms  (admin only)
export const createRoom = asyncHandler(async (req, res) => {
  const { name, type, capacity, location, facilities, description } = req.body;

  if (!name || !capacity) {
    return res.status(400).json({
      success: false,
      message: "Room name and capacity are required.",
    });
  }

  const room = await Room.create({ name, type, capacity, location, facilities, description });
  res.status(201).json({ success: true, message: "Room created.", room });
});

// PUT /api/rooms/:id  (admin only)
export const updateRoom = asyncHandler(async (req, res) => {
  const allowed = ["name", "type", "capacity", "location", "facilities", "description", "isAvailable"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const room = await Room.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!room) return res.status(404).json({ success: false, message: "Room not found." });
  res.status(200).json({ success: true, message: "Room updated.", room });
});

// DELETE /api/rooms/:id  (admin only)
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: "Room not found." });
  res.status(200).json({ success: true, message: "Room deleted." });
});

// ── Booking ──────────────────────────────────────────────────────────────────

// GET /api/bookings
export const getBookings = asyncHandler(async (req, res) => {
  const filter = {};

  // Students and faculty see only their own bookings; admins see all
  if (req.user.role !== "admin") {
    filter.bookedBy = req.user._id;
  }

  const { room, status, date } = req.query;
  if (room) filter.room = room;
  if (status) filter.status = status;
  if (date) filter.date = new Date(date);

  const bookings = await Booking.find(filter)
    .populate("room", "name type capacity location")
    .populate("bookedBy", "name email role")
    .sort({ date: -1 });

  res.status(200).json({ success: true, bookings });
});

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { roomId, date, startTime, endTime, purpose } = req.body;

  if (!roomId || !date || !startTime || !endTime || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Room, date, start time, end time, and purpose are required.",
    });
  }

  if (startTime >= endTime) {
    return res.status(400).json({
      success: false,
      message: "End time must be after start time.",
    });
  }

  const bookingDate = new Date(date);
  if (bookingDate < new Date(new Date().toDateString())) {
    return res.status(400).json({
      success: false,
      message: "Booking date cannot be in the past.",
    });
  }

  const room = await Room.findById(roomId);
  if (!room || !room.isAvailable) {
    return res.status(404).json({ success: false, message: "Room not found or unavailable." });
  }

  /**
   * Conflict check: look for any approved booking on the same room and date
   * whose time window overlaps with the requested window.
   *
   * Overlap condition: existing.start < requested.end AND existing.end > requested.start
   * This prevents two users from booking the same room at the same time.
   */
  const conflict = await Booking.findOne({
    room: roomId,
    date: bookingDate,
    status: "approved",
    $and: [
      { startTime: { $lt: endTime } },
      { endTime: { $gt: startTime } },
    ],
  });

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: `This room is already booked from ${conflict.startTime} to ${conflict.endTime} on that date.`,
    });
  }

  const booking = await Booking.create({
    room: roomId,
    bookedBy: req.user._id,
    date: bookingDate,
    startTime,
    endTime,
    purpose,
  });

  res.status(201).json({
    success: true,
    message: "Booking request submitted. Awaiting admin approval.",
    booking,
  });
});

// PUT /api/bookings/:id/status  (admin only — approve or reject)
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved or rejected." });
  }

  const booking = await Booking.findById(req.params.id).populate("room", "name");
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

  // If approving, re-run the conflict check to handle race conditions
  if (status === "approved") {
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      room: booking.room._id,
      date: booking.date,
      status: "approved",
      $and: [
        { startTime: { $lt: booking.endTime } },
        { endTime: { $gt: booking.startTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Cannot approve: another booking has already been approved for this slot.",
      });
    }
  }

  booking.status = status;
  booking.adminNote = adminNote || "";
  await booking.save();

  // Notify the person who made the booking
  const io = req.app.get("io");
  await sendNotification(io, Notification, {
    recipient: booking.bookedBy,
    type: status === "approved" ? "booking_approved" : "booking_rejected",
    title: `Booking ${status === "approved" ? "Approved" : "Rejected"}`,
    message: `Your booking for ${booking.room.name} on ${booking.date.toDateString()} has been ${status}.`,
    link: "/bookings",
  });

  res.status(200).json({ success: true, message: `Booking ${status}.`, booking });
});

// PUT /api/bookings/:id/cancel  (owner cancels their own pending booking)
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

  // Ownership check — only the person who created the booking can cancel it
  if (booking.bookedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only cancel your own bookings." });
  }

  if (!["pending", "approved"].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: "Only pending or approved bookings can be cancelled.",
    });
  }

  booking.status = "cancelled";
  await booking.save();

  res.status(200).json({ success: true, message: "Booking cancelled.", booking });
});
