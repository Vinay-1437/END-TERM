import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  BookOpen,
  Building2,
  Megaphone,
  Search,
  Users,
  Calendar,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const studentLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assignments", label: "Assignments", icon: BookOpen },
    { to: "/bookings", label: "Book Room", icon: Building2 },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/lost-found", label: "Lost & Found", icon: Search },
    { to: "/clubs", label: "Clubs", icon: Users },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/chat", label: "Chat", icon: MessageSquare },
  ];

  const facultyLinks = [
    { to: "/dashboard/faculty", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assignments", label: "Assignments", icon: BookOpen },
    { to: "/bookings", label: "Bookings", icon: Building2 },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/chat", label: "Chat", icon: MessageSquare },
  ];

  const adminLinks = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/rooms", label: "Rooms", icon: Building2 },
    { to: "/admin/bookings", label: "Bookings", icon: Calendar },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/clubs", label: "Clubs", icon: Users },
    { to: "/admin/lost-found", label: "Lost & Found", icon: Search },
  ];

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "faculty"
      ? facultyLinks
      : studentLinks;

  return (
    <nav className="app-navbar sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="nav-inner flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="app-brand flex items-center gap-3 font-extrabold shrink-0">
            <span className="app-brand-mark"><GraduationCap className="w-6 h-6" /></span>
            <span className="hidden sm:flex flex-col leading-tight text-[17px]">SmartCampus<span className="text-[10px] font-semibold tracking-[.16em] uppercase text-slate-400 mt-1">Campus, connected</span></span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`app-nav-link flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition ${
                  isActive(to)
                    ? "active bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile link */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user?.name?.split(" ")[0]}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`app-nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive(to)
                    ? "active bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
