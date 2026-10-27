import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Verifies the JWT stored in an HTTP-only cookie.
 * Attaches the authenticated user to req.user for downstream handlers.
 * Rejects requests with missing, expired, or tampered tokens.
 */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch a fresh copy of the user — catches deleted or deactivated accounts
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account not found or has been deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws for expired or invalid tokens
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
};

/**
 * Restricts access to users whose role is in the allowed list.
 * Always use after the protect middleware so req.user is populated.
 *
 * Example: authorize("admin", "faculty")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};
