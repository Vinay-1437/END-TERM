import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";

/**
 * Format a date to a readable string like "Oct 26, 2026"
 */
export const formatDate = (date) => {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
};

/**
 * Format a date with time, e.g. "Oct 26, 2026 at 3:00 PM"
 */
export const formatDateTime = (date) => {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
};

/**
 * Returns "2 hours ago", "3 days ago", etc.
 */
export const timeAgo = (date) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Returns true if a deadline is within the next 48 hours and not yet passed
 */
export const isDeadlineSoon = (deadline) => {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return isAfter(d, now) && isBefore(d, in48h);
};

/**
 * Returns true if the deadline has already passed
 */
export const isOverdue = (deadline) => {
  if (!deadline) return false;
  return isBefore(new Date(deadline), new Date());
};

/**
 * Extracts a user-friendly error message from an Axios error response
 */
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/**
 * Returns Tailwind color classes based on assignment status
 */
export const getStatusColor = (status) => {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    active: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    registered: "bg-blue-100 text-blue-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
