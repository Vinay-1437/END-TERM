import Announcement from "../models/announcement.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// GET /api/announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 15 } = req.query;
  const now = new Date();

  // Only return active announcements that haven't expired
  const filter = {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  if (category && category !== "all") filter.category = category;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .populate("author", "name role department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Announcement.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    announcements,
  });
});

// GET /api/announcements/:id
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate(
    "author",
    "name role department"
  );

  if (!announcement || !announcement.isActive) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  res.status(200).json({ success: true, announcement });
});

// POST /api/announcements  (faculty and admin)
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, expiresAt } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Title and description are required.",
    });
  }

  const announcement = await Announcement.create({
    title,
    description,
    category: category || "general",
    author: req.user._id,
    expiresAt: expiresAt || null,
  });

  res.status(201).json({
    success: true,
    message: "Announcement published.",
    announcement,
  });
});

// PUT /api/announcements/:id  (author or admin)
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  // Only the author or an admin can edit
  const isAuthor = announcement.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to edit this announcement.",
    });
  }

  const allowed = ["title", "description", "category", "expiresAt", "isActive"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await Announcement.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: "Announcement updated.", announcement: updated });
});

// DELETE /api/announcements/:id  (author or admin)
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  const isAuthor = announcement.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  // Soft delete — mark inactive rather than removing from history
  announcement.isActive = false;
  await announcement.save();

  res.status(200).json({ success: true, message: "Announcement removed." });
});
