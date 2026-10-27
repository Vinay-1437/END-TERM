import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { notificationAPI } from "../services/api.js";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect to Socket.IO whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      // Clean up the socket connection when the user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    /**
     * The browser automatically sends the HTTP-only cookie with the Socket.IO
     * handshake because `withCredentials: true` is set. The server reads and
     * verifies the JWT from that cookie — no manual token management needed here.
     */
    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { withCredentials: true }
    );

    newSocket.on("connect", () => {
      console.log("[Socket] Connected, id:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      // Non-fatal — the app works without the socket; notifications are still fetched via REST
      console.warn("[Socket] Connection error:", err.message);
    });

    // Receive real-time notifications for this user (sent to the "user:<id>" room)
    newSocket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    setSocket(newSocket);

    // Disconnect when the user changes (logout or switch)
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]); // only re-connect when the user ID changes

  // Fetch persisted notifications from the database on login
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const { data } = await notificationAPI.getAll({ limit: 20 });
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // Fail silently — the app still works without the notification list
      }
    };

    loadNotifications();
  }, [user?._id]);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <NotificationContext.Provider
      value={{ socket, notifications, unreadCount, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};
