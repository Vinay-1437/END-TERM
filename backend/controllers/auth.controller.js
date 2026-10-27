import User from "../models/user.model.js";
import { setAuthCookie } from "../utils/helpers.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, rollNumber } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required.",
    });
  }

  // Public registration is always "student" — admins cannot be self-assigned
  const user = await User.create({
    name,
    email,
    password,
    role: "student",
    department: department || "",
    rollNumber: rollNumber || "",
  });

  setAuthCookie(res, user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    user,
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  // Explicitly select password because it is excluded by default in the schema
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your account has been deactivated. Contact an administrator.",
    });
  }

  setAuthCookie(res, user._id);

  // Strip the password before sending the user object
  const { password: _pw, ...safeUser } = user.toObject();

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    user: safeUser,
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
