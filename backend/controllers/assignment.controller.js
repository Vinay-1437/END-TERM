import Assignment from "../models/assignment.model.js";
import AssignmentStatus from "../models/assignmentStatus.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { sendNotification } from "../utils/helpers.js";

// GET /api/assignments
export const getAssignments = asyncHandler(async (req, res) => {
  const { subject, status } = req.query;
  const filter = { isActive: true };

  if (subject) filter.subject = new RegExp(subject, "i");

  // Faculty see only their own assignments; students see all active ones
  if (req.user.role === "faculty") {
    filter.createdBy = req.user._id;
  }

  const assignments = await Assignment.find(filter)
    .populate("createdBy", "name department")
    .sort({ deadline: 1 });

  // For students, attach their individual status to each assignment
  if (req.user.role === "student") {
    const ids = assignments.map((a) => a._id);
    const statuses = await AssignmentStatus.find({
      student: req.user._id,
      assignment: { $in: ids },
    });

    const statusMap = {};
    statuses.forEach((s) => {
      statusMap[s.assignment.toString()] = s.status;
    });

    const withStatus = assignments.map((a) => ({
      ...a.toObject(),
      myStatus: statusMap[a._id.toString()] || "pending",
    }));

    // Client-side filter by status if requested
    const filtered =
      status
        ? withStatus.filter((a) => {
            if (status === "overdue")
              return a.myStatus === "pending" && new Date(a.deadline) < new Date();
            return a.myStatus === status;
          })
        : withStatus;

    return res.status(200).json({ success: true, assignments: filtered });
  }

  res.status(200).json({ success: true, assignments });
});

// POST /api/assignments  (faculty only)
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, deadline, targetDepartment, maxMarks } =
    req.body;

  if (!title || !description || !subject || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Title, description, subject, and deadline are required.",
    });
  }

  const assignment = await Assignment.create({
    title,
    description,
    subject,
    deadline,
    targetDepartment: targetDepartment || "",
    maxMarks: maxMarks || 100,
    createdBy: req.user._id,
  });

  // Notify all students (or students of the target department) about the new assignment
  const studentFilter = { role: "student", isActive: true };
  if (targetDepartment) studentFilter.department = targetDepartment;
  const students = await User.find(studentFilter).select("_id");

  const io = req.app.get("io");
  await Promise.all(
    students.map((student) =>
      sendNotification(io, Notification, {
        recipient: student._id,
        type: "assignment_new",
        title: "New Assignment",
        message: `${req.user.name} posted a new assignment: "${title}"`,
        link: `/assignments`,
      })
    )
  );

  res.status(201).json({
    success: true,
    message: "Assignment created.",
    assignment,
  });
});

// PUT /api/assignments/:id  (faculty who created it only)
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  // Only the creating faculty member can edit the assignment
  if (assignment.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only edit assignments you created.",
    });
  }

  const allowed = ["title", "description", "subject", "deadline", "targetDepartment", "maxMarks"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await Assignment.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: "Assignment updated.", assignment: updated });
});

// DELETE /api/assignments/:id  (faculty who created it only)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  if (assignment.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only delete assignments you created.",
    });
  }

  await assignment.deleteOne();
  // Also clean up all status records tied to this assignment
  await AssignmentStatus.deleteMany({ assignment: req.params.id });

  res.status(200).json({ success: true, message: "Assignment deleted." });
});

// PUT /api/assignments/:id/status  (student only — mark own status)
export const updateMyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value." });
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || !assignment.isActive) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  // findOneAndUpdate with upsert creates the record if it doesn't exist yet
  const statusRecord = await AssignmentStatus.findOneAndUpdate(
    { assignment: req.params.id, student: req.user._id },
    {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: `Assignment marked as ${status}.`,
    statusRecord,
  });
});
