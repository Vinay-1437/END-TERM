import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { setupSocketHandlers } from "./socket/socket.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import roomRoutes from "./routes/room.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import lostFoundRoutes from "./routes/lostFound.routes.js";
import clubRoutes from "./routes/club.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import messageRoutes from "./routes/message.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app); // Socket.IO needs the raw HTTP server
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (e.g., Render, Heroku) for secure cookies over HTTPS
app.set("trust proxy", 1);

// ── Database ─────────────────────────────────────────────────────────────────
await connectDB();

// ── CORS ──────────────────────────────────────────────────────────────────────
const rawOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [];
const configuredOrigins = rawOrigins.map((u) => u.trim().replace(/\/$/, "")).filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOriginChecker = (origin, callback) => {
  // Allow server-to-server, curl, Postman, health checks (no origin header)
  if (!origin) return callback(null, true);

  const isAllowed =
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    (process.env.NODE_ENV !== "production" && (origin.includes("localhost") || origin.includes("127.0.0.1")));

  if (isAllowed) {
    return callback(null, true);
  }
  return callback(null, true);
};

app.use(
  cors({
    origin: corsOriginChecker,
    credentials: true, // required so cookies are sent cross-origin
  })
);

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginChecker,
    credentials: true,
  },
});

setupSocketHandlers(io);

// Make io accessible inside route handlers via req.app.get("io")
app.set("io", io);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api", roomRoutes);          // exposes /api/rooms and /api/bookings
app.use("/api/announcements", announcementRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api", clubRoutes);          // exposes /api/clubs and /api/events
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Campus Management Platform API is running." });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler — must be last
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[Server] Smart Campus API running on http://localhost:${PORT}`);
});
