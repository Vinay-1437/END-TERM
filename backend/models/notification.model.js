import mongoose from "mongoose";

/**
 * Notifications are stored in MongoDB so they survive page refreshes and
 * re-logins. Socket.IO is used for real-time delivery on top of this.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "assignment_new",
        "assignment_deadline",
        "announcement",
        "booking_approved",
        "booking_rejected",
        "event_reminder",
        "general",
      ],
      default: "general",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional link to the resource that triggered this notification
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
