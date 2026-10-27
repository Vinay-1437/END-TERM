/**
 * Catches any error passed via next(error) or thrown in async handlers.
 * Returns a consistent JSON error shape without leaking stack traces.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("[Error]", err.message);

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with that ${field} already exists.`,
    });
  }

  // Mongoose validation errors (required fields, enum violations, etc.)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(" | "),
    });
  }

  // Multer file-size or type errors
  if (err.name === "MulterError" || err.message?.includes("Only")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong. Please try again.",
  });
};

/**
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to the central error handler instead of crashing Express.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
