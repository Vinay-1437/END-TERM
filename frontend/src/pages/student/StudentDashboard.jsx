import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Building2, Megaphone, Calendar,
  Clock, CheckCircle, AlertCircle, ArrowRight,
} from "lucide-react";
import { dashboardAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { PageLoader, EmptyState, StatCard } from "../../components/UI.jsx";
import { formatDate, isOverdue, isDeadlineSoon, getStatusColor } from "../../utils/helpers.js";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getStudentDashboard();
        setData(res.data.dashboard);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <MainLayout><PageLoader /></MainLayout>;

  const { assignments = [], announcements = [], bookings = [], upcomingEvents = [] } = data || {};

  // Compute quick stats from the data
  const pending = assignments.filter((a) => a.myStatus === "pending" && !isOverdue(a.deadline)).length;
  const overdue = assignments.filter((a) => a.myStatus === "pending" && isOverdue(a.deadline)).length;
  const completed = assignments.filter((a) => a.myStatus === "completed").length;

  return (
    <MainLayout>
      {/* Welcome header */}
      <section className="relative overflow-hidden rounded-3xl mb-8 px-6 py-7 sm:px-8 sm:py-8 text-white shadow-lg" style={{ background: "linear-gradient(115deg, #312e81 0%, #4338ca 54%, #6366f1 100%)" }}>
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[34px] border-white/10" />
        <div aria-hidden="true" className="absolute right-28 -bottom-24 h-48 w-48 rounded-full bg-indigo-300/10" />
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-200 mb-3">Your campus at a glance</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-3">
            {user?.department || "SmartCampus community"} <span className="mx-2 text-indigo-300">•</span> {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-indigo-100/90 text-sm mt-4 max-w-xl">Stay on top of your coursework, find your next campus event, and keep your day moving.</p>
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="Pending" value={pending} icon={Clock} color="yellow" subtitle="assignments" />
        <StatCard title="Overdue" value={overdue} icon={AlertCircle} color="red" subtitle="assignments" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" subtitle="assignments" />
        <StatCard title="Events" value={upcomingEvents.length} icon={Calendar} color="blue" subtitle="upcoming" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-700">Upcoming Assignments</h2>
              </div>
              <Link to="/assignments" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {assignments.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No assignments yet"
                  description="Your faculty will post assignments here."
                />
              ) : (
                assignments.slice(0, 5).map((a) => {
                  const overdueFlag = a.myStatus === "pending" && isOverdue(a.deadline);
                  const soonFlag = isDeadlineSoon(a.deadline);
                  return (
                    <div key={a._id} className="px-5 py-4 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{a.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {a.subject} • {a.createdBy?.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(a.myStatus === "pending" && overdueFlag ? "overdue" : a.myStatus)}`}>
                            {overdueFlag ? "Overdue" : a.myStatus}
                          </span>
                          <p className={`text-xs mt-1 ${overdueFlag ? "text-red-500" : soonFlag ? "text-yellow-600" : "text-slate-400"}`}>
                            Due: {formatDate(a.deadline)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-slate-700">My Room Bookings</h2>
              </div>
              <Link to="/bookings" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No bookings yet"
                  description="Book a classroom or lab for your group study."
                />
              ) : (
                bookings.slice(0, 4).map((b) => (
                  <div key={b._id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{b.room?.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(b.date)} • {b.startTime} – {b.endTime}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-slate-700">Announcements</h2>
              </div>
              <Link to="/announcements" className="text-xs text-blue-600 hover:underline">
                All
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {announcements.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No announcements.</p>
              ) : (
                announcements.map((a) => (
                  <Link
                    key={a._id}
                    to={`/announcements/${a._id}`}
                    className="block px-5 py-3 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-700 line-clamp-2">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.createdAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-slate-700">My Events</h2>
              </div>
              <Link to="/events" className="text-xs text-blue-600 hover:underline">
                All
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No registered events.</p>
              ) : (
                upcomingEvents.map((e) => (
                  <div key={e._id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{e.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(e.eventDate)} • {e.venue}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
