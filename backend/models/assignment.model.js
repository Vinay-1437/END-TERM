import mongoose from "mongoose";

/**
 * An assignment is a single shared document created by faculty.
 * Individual student progress is tracked in the AssignmentStatus model,
 * keeping one student's completion from affecting another's.
 */
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    // The faculty member who created the assignment
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    // Optional: restrict to a specific department or class
    targetDepartment: {
      type: String,
      trim: true,
      default: "",
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for common query patterns
assignmentSchema.index({ createdBy: 1, deadline: 1 });
assignmentSchema.index({ targetDepartment: 1, deadline: 1 });

export default mongoose.model("Assignment", assignmentSchema);
