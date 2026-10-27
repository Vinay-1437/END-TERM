import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Events can be standalone or tied to a club
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    // 0 means unlimited capacity
    maxParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      enum: ["workshop", "seminar", "competition", "social", "sports", "other"],
      default: "other",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ eventDate: 1, isActive: 1 });
eventSchema.index({ club: 1 });

export default mongoose.model("Event", eventSchema);
