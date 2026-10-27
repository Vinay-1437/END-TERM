import mongoose from "mongoose";

/**
 * A booking reserves a room for a specific date and time window.
 * Conflict checking (no two approved bookings overlap) is enforced
 * in the booking controller before any booking is approved.
 */
const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    startTime: {
      type: String, // "09:00" — storing as HH:MM string for simplicity
      required: [true, "Start time is required"],
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:MM format"],
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
      maxlength: [300, "Purpose cannot exceed 300 characters"],
    },
    // "pending" awaits admin review; "approved" confirms the slot; "rejected" frees it again
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Index to speed up conflict queries — look up bookings by room + date + status
bookingSchema.index({ room: 1, date: 1, status: 1 });
bookingSchema.index({ bookedBy: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);
