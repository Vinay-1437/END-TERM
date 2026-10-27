import axios from "axios";

// Central Axios instance — all API calls go through here
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // send the HTTP-only cookie on every request
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  searchDirectory: (search) => api.get("/users/directory", { params: { search } }),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/change-password", data),
  // Admin only
  getAllUsers: (params) => api.get("/users", { params }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStudentDashboard: () => api.get("/dashboard/student"),
  getAdminDashboard: () => api.get("/dashboard/admin"),
};

// ── Assignments ───────────────────────────────────────────────────────────────
export const assignmentAPI = {
  getAll: (params) => api.get("/assignments", { params }),
  create: (data) => api.post("/assignments", data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  remove: (id) => api.delete(`/assignments/${id}`),
  updateMyStatus: (id, status) => api.put(`/assignments/${id}/status`, { status }),
};

// ── Rooms & Bookings ──────────────────────────────────────────────────────────
export const roomAPI = {
  getAll: (params) => api.get("/rooms", { params }),
  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  remove: (id) => api.delete(`/rooms/${id}`),
};

export const bookingAPI = {
  getAll: (params) => api.get("/bookings", { params }),
  create: (data) => api.post("/bookings", data),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementAPI = {
  getAll: (params) => api.get("/announcements", { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post("/announcements", data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  remove: (id) => api.delete(`/announcements/${id}`),
};

// ── Lost & Found ──────────────────────────────────────────────────────────────
export const lostFoundAPI = {
  getAll: (params) => api.get("/lost-found", { params }),
  getById: (id) => api.get(`/lost-found/${id}`),
  create: (formData) =>
    api.post("/lost-found", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.put(`/lost-found/${id}`, data),
  remove: (id) => api.delete(`/lost-found/${id}`),
  resolve: (id) => api.put(`/lost-found/${id}/resolve`),
};

// ── Clubs & Events ────────────────────────────────────────────────────────────
export const clubAPI = {
  getAll: (params) => api.get("/clubs", { params }),
  create: (data) => api.post("/clubs", data),
  update: (id, data) => api.put(`/clubs/${id}`, data),
  join: (id) => api.post(`/clubs/${id}/join`),
  leave: (id) => api.delete(`/clubs/${id}/leave`),
};

export const eventAPI = {
  getAll: (params) => api.get("/events", { params }),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  register: (id) => api.post(`/events/${id}/register`),
  cancelRegistration: (id) => api.delete(`/events/${id}/cancel-registration`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/mark-all-read"),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  getConversations: () => api.get("/conversations"),
  getOrCreate: (participantId) => api.post("/conversations", { participantId }),
  getMessages: (conversationId, params) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
};

export default api;
