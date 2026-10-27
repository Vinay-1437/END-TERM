import mongoose from "mongoose";

const lostFoundSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [150, "Item name cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    // "lost" = someone lost this item; "found" = someone found this item
    type: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Type (lost/found) is required"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // Store Cloudinary public_id so we can delete the image if needed
    imagePublicId: {
      type: String,
      default: "",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // "active" = still looking; "resolved" = item returned/claimed; "removed" = admin action
    status: {
      type: String,
      enum: ["active", "resolved", "removed"],
      default: "active",
    },
    contactInfo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

lostFoundSchema.index({ type: 1, status: 1, createdAt: -1 });
lostFoundSchema.index({ postedBy: 1 });

export default mongoose.model("LostFound", lostFoundSchema);
