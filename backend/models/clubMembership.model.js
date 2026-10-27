import mongoose from "mongoose";

/**
 * One record per (club, student) pair — enforced by unique index.
 * This prevents a student from joining the same club twice.
 */
const clubMembershipSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "secretary", "president"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

clubMembershipSchema.index({ club: 1, student: 1 }, { unique: true });

export default mongoose.model("ClubMembership", clubMembershipSchema);
