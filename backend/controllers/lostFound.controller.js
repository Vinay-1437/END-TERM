import LostFound from "../models/lostFound.model.js";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// GET /api/lost-found
export const getLostFoundItems = asyncHandler(async (req, res) => {
  const { type, status = "active", search, page = 1, limit = 12 } = req.query;
  const filter = { status };

  if (type && ["lost", "found"].includes(type)) filter.type = type;
  if (search) {
    filter.$or = [
      { itemName: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { location: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    LostFound.find(filter)
      .populate("postedBy", "name email department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LostFound.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, page: Number(page), items });
});

// GET /api/lost-found/:id
export const getLostFoundById = asyncHandler(async (req, res) => {
  const item = await LostFound.findById(req.params.id).populate(
    "postedBy",
    "name department"
  );

  if (!item || item.status === "removed") {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  res.status(200).json({ success: true, item });
});

// POST /api/lost-found
export const createLostFoundItem = asyncHandler(async (req, res) => {
  const { itemName, description, type, location, date, contactInfo } = req.body;

  if (!itemName || !description || !type || !date) {
    return res.status(400).json({
      success: false,
      message: "Item name, description, type, and date are required.",
    });
  }

  let imageUrl = "";
  let imagePublicId = "";

  if (req.file) {
    if (isCloudinaryConfigured) {
      // Cloudinary storage — the path and filename are set by the storage engine
      imageUrl = req.file.path;
      imagePublicId = req.file.filename;
    } else {
      // No Cloudinary config — skip image but don't fail the whole request
      console.warn("[LostFound] Image uploaded but Cloudinary is not configured. Image skipped.");
    }
  }

  const item = await LostFound.create({
    itemName,
    description,
    type,
    location: location || "",
    date,
    imageUrl,
    imagePublicId,
    contactInfo: contactInfo || "",
    postedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: "Post created.", item });
});

// PUT /api/lost-found/:id  (owner only)
export const updateLostFoundItem = asyncHandler(async (req, res) => {
  const item = await LostFound.findById(req.params.id);
  if (!item || item.status === "removed") {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  if (item.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only edit your own posts." });
  }

  const allowed = ["itemName", "description", "location", "date", "contactInfo"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await LostFound.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: "Post updated.", item: updated });
});

// DELETE /api/lost-found/:id  (owner or admin)
export const deleteLostFoundItem = asyncHandler(async (req, res) => {
  const item = await LostFound.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Post not found." });

  const isOwner = item.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  // Delete the associated Cloudinary image when we remove the post
  if (item.imagePublicId && isCloudinaryConfigured) {
    await cloudinary.uploader.destroy(item.imagePublicId).catch(() => {});
  }

  // Admins "remove" for moderation; owners delete completely
  if (req.user.role === "admin" && !isOwner) {
    item.status = "removed";
    await item.save();
  } else {
    await item.deleteOne();
  }

  res.status(200).json({ success: true, message: "Post deleted." });
});

// PUT /api/lost-found/:id/resolve  (owner only)
export const resolveLostFoundItem = asyncHandler(async (req, res) => {
  const item = await LostFound.findById(req.params.id);
  if (!item || item.status === "removed") {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  if (item.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only resolve your own posts." });
  }

  item.status = "resolved";
  await item.save();

  res.status(200).json({ success: true, message: "Post marked as resolved.", item });
});
