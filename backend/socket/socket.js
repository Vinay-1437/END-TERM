import jwt from "jsonwebtoken";
import { parseCookie } from "cookie";
import { Conversation, Message } from "../models/message.model.js";
import User from "../models/user.model.js";

/**
 * Sets up all Socket.IO event handlers.
 *
 * Authentication: Socket.IO sends HTTP cookies automatically when
 * `withCredentials: true` is set on the client. We parse the cookie header
 * here and verify the JWT — same mechanism used by the REST middleware.
 *
 * Private rooms: each authenticated user joins "user:<userId>" on connect.
 * This is how we deliver targeted notifications without broadcasting to everyone.
 */
export const setupSocketHandlers = (io) => {
  // Middleware — runs on every new socket connection
  io.use(async (socket, next) => {
    try {
      // Parse the cookie from the handshake headers (sent automatically by browsers)
      const rawCookies = socket.handshake.headers?.cookie || "";
      const cookies = parseCookie(rawCookies);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user || !user.isActive) {
        return next(new Error("User not found or deactivated."));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`[Socket] Connected: ${user.name} (${user.role}) — ${socket.id}`);

    // Join the user's private room so notifications can be delivered directly
    socket.join(`user:${user._id}`);

    // ── Chat events ────────────────────────────────────────────────────────

    // Client joins a conversation room to receive its real-time messages
    socket.on("conversation:join", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Only participants may join the room — security check on the server
        const isParticipant = conversation.participants
          .map((p) => p.toString())
          .includes(user._id.toString());

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error("[Socket] conversation:join error:", err.message);
      }
    });

    // Handle a new outgoing message
    socket.on("message:send", async ({ conversationId, content }) => {
      try {
        if (!conversationId || !content?.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants
          .map((p) => p.toString())
          .includes(user._id.toString());

        if (!isParticipant) return;

        // Persist the message to MongoDB
        const message = await Message.create({
          conversation: conversationId,
          sender: user._id,
          content: content.trim(),
        });

        await message.populate("sender", "name avatar role");

        // Update the conversation's last-message preview for the sidebar
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.trim().slice(0, 100),
          lastMessageAt: new Date(),
        });

        // Deliver to everyone in the conversation room (including the sender's own tab)
        io.to(`conversation:${conversationId}`).emit("message:new", message);
      } catch (err) {
        console.error("[Socket] message:send error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${user.name} — ${socket.id}`);
    });
  });
};
