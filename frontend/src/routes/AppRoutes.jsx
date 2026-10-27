import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

// Auth
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// Student pages
import StudentDashboard from "../pages/student/StudentDashboard.jsx";
import Assignments from "../pages/student/Assignments.jsx";
import Bookings from "../pages/student/Bookings.jsx";
import Announcements from "../pages/student/Announcements.jsx";
import AnnouncementDetail from "../pages/student/AnnouncementDetail.jsx";
import LostFound from "../pages/student/LostFound.jsx";
import ClubsAndEvents from "../pages/student/ClubsAndEvents.jsx";
import Notifications from "../pages/student/Notifications.jsx";
import Profile from "../pages/student/Profile.jsx";
import Chat from "../pages/student/Chat.jsx";

// Faculty pages
import FacultyDashboard from "../pages/faculty/FacultyDashboard.jsx";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AdminUsers from "../pages/admin/AdminUsers.jsx";
import AdminRooms from "../pages/admin/AdminRooms.jsx";
import AdminClubs from "../pages/admin/AdminClubs.jsx";

/**
 * Smart redirect to correct dashboard based on role.
 * This avoids showing a student dashboard to an admin or faculty member.
 */
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "faculty") return <Navigate to="/dashboard/faculty" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Smart root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Student dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Faculty dashboard */}
      <Route
        path="/dashboard/faculty"
        element={
          <ProtectedRoute roles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Shared pages — accessible by all authenticated roles */}
      <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="/announcements/:id" element={<ProtectedRoute><AnnouncementDetail /></ProtectedRoute>} />
      <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
      <Route path="/clubs" element={<ProtectedRoute><ClubsAndEvents /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><ClubsAndEvents /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

      {/* Admin-only routes */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute roles={["admin"]}><AdminRooms /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={["admin"]}><Bookings /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute roles={["admin"]}><Announcements /></ProtectedRoute>} />
      <Route path="/admin/clubs" element={<ProtectedRoute roles={["admin"]}><AdminClubs /></ProtectedRoute>} />
      <Route path="/admin/lost-found" element={<ProtectedRoute roles={["admin"]}><LostFound /></ProtectedRoute>} />

      {/* Catch-all → smart redirect */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
