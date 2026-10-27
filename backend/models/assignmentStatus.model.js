import mongoose from "mongoose";

/**
 * Tracks each individual student's status for a given assignment.
 * A unique index on (assignment, student) guarantees one record per pair —
 * one student's completion never touches another student's record.
 */
const assignmentStatusSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // "pending" → not yet done; "completed" → marked done by student
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure a student can only have one status record per assignment
assignmentStatusSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("AssignmentStatus", assignmentStatusSchema);
