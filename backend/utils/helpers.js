import jwt from "jsonwebtoken";

/**
 * Signs a JWT containing the user's ID and sets it as an HTTP-only cookie.
 * HTTP-only cookies are not accessible from JavaScript, which protects against XSS attacks.
 *
 * @param {object} res   - Express response object
 * @param {string} userId - MongoDB ObjectId of the authenticated user
 */
export const setAuthCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,         // Prevent JS access — XSS protection
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",        // CSRF protection while allowing normal navigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * Creates a Notification document and emits it to the recipient in real time
 * if they are currently connected via Socket.IO.
 *
 * @param {object} io           - Socket.IO server instance
 * @param {object} Notification - Mongoose Notification model
 * @param {object} data         - { recipient, type, title, message, link }
 */
export const sendNotification = async (io, Notification, data) => {
  try {
    const notification = await Notification.create(data);

    // Emit to the recipient's personal Socket.IO room (joined on connect)
    if (io) {
      io.to(`user:${data.recipient}`).emit("notification:new", notification);
    }

    return notification;
  } catch (error) {
    // Notification failure should never break the primary operation
    console.error("[Notification] Failed to send:", error.message);
  }
};
