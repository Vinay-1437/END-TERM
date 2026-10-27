import User from "../models/user.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "department", "rollNumber", "phone", "bio"];
  const updates = {};

  // Only allow whitelisted fields — prevent mass-assignment of role, email, etc.
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated.",
    user,
  });
});

// PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect.",
    });
  }

  user.password = newPassword;
  await user.save(); // triggers the pre-save hash hook

  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});


// GET /api/users/directory (authenticated campus members only)
// This is deliberately separate from the admin user-management endpoint.
export const searchDirectory = asyncHandler(async (req, res) => {
  const query = String(req.query.search || "").trim();
  if (query.length < 2) {
    return res.status(200).json({ success: true, users: [] });
  }

  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    name: { $regex: safeQuery, $options: "i" },
  })
    .select("name role department avatar")
    .sort({ name: 1 })
    .limit(10);

  res.status(200).json({ success: true, users });
});

// ── Admin-only routes ────────────────────────────────────────────────────────

// GET /api/users  (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    users,
  });
});

// PUT /api/users/:id/role  (admin only)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "faculty", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role." });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.status(200).json({ success: true, message: "Role updated.", user });
});

// PUT /api/users/:id/toggle-active  (admin only)
export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"}.`,
    user,
  });
});
