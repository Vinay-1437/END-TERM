import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Building2, Megaphone, Calendar, Users,
  Plus, ArrowRight, Clock
} from "lucide-react";
import { assignmentAPI, bookingAPI, announcementAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { PageLoader, StatCard, Card, Button, EmptyState } from "../../components/UI.jsx";
import { formatDate, getStatusColor, getErrorMessage } from "../../utils/helpers.js";

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, anRes, bRes] = await Promise.all([
          assignmentAPI.getAll(),
          announcementAPI.getAll({ limit: 5 }),
          bookingAPI.getAll(),
        ]);
        setAssignments(aRes.data.assignments || []);
        setAnnouncements(anRes.data.announcements || []);
        setBookings(bRes.data.bookings || []);
      } catch (e) {
        console.error("Faculty dashboard load failed:", e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <MainLayout><PageLoader /></MainLayout>;

  const activeAssignments = assignments.filter((a) => a.isActive).length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const approvedBookings = bookings.filter((b) => b.status === "approved").length;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Faculty Dashboard • {user?.department}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Assignments" value={activeAssignments} icon={BookOpen} color="blue" />
        <StatCard title="Pending Bookings" value={pendingBookings} icon={Clock} color="yellow" />
        <StatCard title="Approved Bookings" value={approvedBookings} icon={Building2} color="green" />
        <StatCard title="Announcements" value={announcements.length} icon={Megaphone} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { to: "/assignments", label: "New Assignment", icon: BookOpen },
          { to: "/bookings", label: "Book a Room", icon: Building2 },
          { to: "/announcements", label: "Post Announcement", icon: Megaphone },
          { to: "/events", label: "Create Event", icon: Calendar },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-200 transition"
          >
            <Icon className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assignments */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> My Assignments
            </h2>
            <Link to="/assignments" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {assignments.length === 0 ? (
              <EmptyState icon={BookOpen} title="No assignments yet" description="Create your first assignment." />
            ) : (
              assignments.slice(0, 5).map((a) => (
                <div key={a._id} className="px-5 py-3">
                  <p className="font-medium text-sm text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.subject} • Due: {formatDate(a.deadline)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* My Bookings */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" /> My Room Bookings
            </h2>
            <Link to="/bookings" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {bookings.length === 0 ? (
              <EmptyState icon={Building2} title="No bookings" />
            ) : (
              bookings.slice(0, 5).map((b) => (
                <div key={b._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{b.room?.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(b.date)} • {b.startTime}–{b.endTime}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default FacultyDashboard;
