import React, { useEffect, useState } from "react";
import { LayoutDashboard, Users, BookOpen, Building2, Calendar, AlertCircle } from "lucide-react";
import { dashboardAPI, bookingAPI } from "../../services/api.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import { PageLoader, StatCard, Card, Button } from "../../components/UI.jsx";
import { formatDate, getStatusColor, getErrorMessage } from "../../utils/helpers.js";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, bookRes] = await Promise.all([
          dashboardAPI.getAdminDashboard(),
          bookingAPI.getAll({ status: "pending" }),
        ]);
        setStats(dashRes.data.stats);
        setPendingBookings(bookRes.data.bookings.slice(0, 5));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await bookingAPI.updateStatus(id, { status: "approved" });
      setPendingBookings((prev) => prev.filter((b) => b._id !== id));
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      await bookingAPI.updateStatus(id, { status: "rejected" });
      setPendingBookings((prev) => prev.filter((b) => b._id !== id));
    } catch {}
  };

  if (loading) return <MainLayout><PageLoader /></MainLayout>;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" /> Admin Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1">Campus management dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue" />
        <StatCard title="Students" value={stats?.totalStudents || 0} icon={Users} color="green" />
        <StatCard title="Faculty" value={stats?.totalFaculty || 0} icon={Users} color="purple" />
        <StatCard title="Pending Bookings" value={stats?.pendingBookings || 0} icon={Building2} color="yellow" />
        <StatCard title="Upcoming Events" value={stats?.totalEvents || 0} icon={Calendar} color="blue" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { to: "/admin/users", label: "Manage Users", icon: Users, color: "blue" },
          { to: "/admin/rooms", label: "Manage Rooms", icon: Building2, color: "purple" },
          { to: "/admin/bookings", label: "All Bookings", icon: Calendar, color: "green" },
          { to: "/admin/clubs", label: "Clubs & Events", icon: BookOpen, color: "yellow" },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition"
          >
            <Icon className={`w-6 h-6 text-${color}-600`} />
            <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* Pending bookings */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" /> Pending Booking Requests
          </h2>
          <Link to="/admin/bookings" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        {pendingBookings.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No pending bookings.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {pendingBookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-sm text-slate-800">{b.room?.name}</p>
                  <p className="text-xs text-slate-400">
                    {b.bookedBy?.name} • {formatDate(b.date)} • {b.startTime}–{b.endTime}
                  </p>
                  <p className="text-xs text-slate-400">{b.purpose}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="success" onClick={() => handleApprove(b._id)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(b._id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default AdminDashboard;
