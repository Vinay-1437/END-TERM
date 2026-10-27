import React, { useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { Button, EmptyState } from "../../components/UI.jsx";
import { timeAgo } from "../../utils/helpers.js";

const typeIcon = {
  assignment_new: "📚",
  assignment_deadline: "⏰",
  announcement: "📢",
  booking_approved: "✅",
  booking_rejected: "❌",
  event_reminder: "🎉",
  general: "🔔",
};

const Notifications = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                n.isRead
                  ? "bg-white border-slate-200"
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <span className="text-2xl">{typeIcon[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Notifications;
