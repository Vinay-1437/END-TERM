import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["classroom", "laboratory", "seminar_hall", "conference_room"],
      default: "classroom",
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    facilities: {
      // e.g. ["projector", "AC", "computers"]
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
