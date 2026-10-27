import Assignment from "../models/assignment.model.js";
import AssignmentStatus from "../models/assignmentStatus.model.js";
import Announcement from "../models/announcement.model.js";
import Booking from "../models/booking.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// GET /api/dashboard/student — aggregated data for the student dashboard
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for efficiency
  const [assignments, announcements, bookings, eventRegs] = await Promise.all([
    // Upcoming / overdue assignments (active ones, sorted by deadline)
    Assignment.find({ isActive: true }).populate("createdBy", "name").sort({ deadline: 1 }).limit(10),
    // Latest 5 announcements
    Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(5),
    // The user's upcoming and recent bookings
    Booking.find({ bookedBy: req.user._id })
      .populate("room", "name type location")
      .sort({ date: -1 })
      .limit(5),
    // Upcoming events the user registered for
    EventRegistration.find({ user: req.user._id, status: "registered" })
      .populate({
        path: "event",
        match: { isActive: true, eventDate: { $gte: now } },
        select: "title eventDate venue",
      })
      .limit(5),
  ]);

  // Attach individual status records to each assignment for this student
  const assignmentIds = assignments.map((a) => a._id);
  const statusRecords = await AssignmentStatus.find({
    student: req.user._id,
    assignment: { $in: assignmentIds },
  });
  const statusMap = {};
  statusRecords.forEach((s) => { statusMap[s.assignment.toString()] = s.status; });

  const assignmentsWithStatus = assignments.map((a) => ({
    ...a.toObject(),
    myStatus: statusMap[a._id.toString()] || "pending",
  }));

  // Filter out eventRegs where the event was null (already passed or inactive)
  const upcomingEvents = eventRegs.filter((r) => r.event !== null).map((r) => r.event);

  res.status(200).json({
    success: true,
    dashboard: {
      assignments: assignmentsWithStatus,
      announcements,
      bookings,
      upcomingEvents,
    },
  });
});

// GET /api/dashboard/admin — overview stats for the admin panel
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalStudents, totalFaculty, pendingBookings, totalEvents] =
    await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "faculty", isActive: true }),
      Booking.countDocuments({ status: "pending" }),
      Event.countDocuments({ isActive: true, eventDate: { $gte: new Date() } }),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalStudents,
      totalFaculty,
      pendingBookings,
      totalEvents,
    },
  });
});
