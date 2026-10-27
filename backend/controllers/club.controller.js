import Club from "../models/club.model.js";
import ClubMembership from "../models/clubMembership.model.js";
import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// ── Clubs ────────────────────────────────────────────────────────────────────

// GET /api/clubs
export const getClubs = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const clubs = await Club.find(filter)
    .populate("managedBy", "name department")
    .sort({ name: 1 });

  // If a student is logged in, attach membership status for each club
  if (req.user.role === "student") {
    const memberships = await ClubMembership.find({ student: req.user._id }).select("club");
    const joinedIds = new Set(memberships.map((m) => m.club.toString()));

    const withMembership = clubs.map((c) => ({
      ...c.toObject(),
      isMember: joinedIds.has(c._id.toString()),
    }));

    return res.status(200).json({ success: true, clubs: withMembership });
  }

  res.status(200).json({ success: true, clubs });
});

// POST /api/clubs  (admin only)
export const createClub = asyncHandler(async (req, res) => {
  const { name, description, category, managedBy } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Club name is required." });

  const club = await Club.create({ name, description, category, managedBy: managedBy || null });
  res.status(201).json({ success: true, message: "Club created.", club });
});

// PUT /api/clubs/:id  (admin only)
export const updateClub = asyncHandler(async (req, res) => {
  const allowed = ["name", "description", "category", "managedBy", "isActive"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const club = await Club.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!club) return res.status(404).json({ success: false, message: "Club not found." });
  res.status(200).json({ success: true, message: "Club updated.", club });
});

// POST /api/clubs/:id/join  (student only)
export const joinClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club || !club.isActive) {
    return res.status(404).json({ success: false, message: "Club not found." });
  }

  try {
    const membership = await ClubMembership.create({
      club: req.params.id,
      student: req.user._id,
    });
    res.status(201).json({ success: true, message: `Joined ${club.name}.`, membership });
  } catch (err) {
    // Unique index violation — already a member
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "You are already a member of this club." });
    }
    throw err;
  }
});

// DELETE /api/clubs/:id/leave  (student only)
export const leaveClub = asyncHandler(async (req, res) => {
  const result = await ClubMembership.findOneAndDelete({
    club: req.params.id,
    student: req.user._id,
  });

  if (!result) {
    return res.status(404).json({ success: false, message: "You are not a member of this club." });
  }

  res.status(200).json({ success: true, message: "Left the club." });
});

// ── Events ───────────────────────────────────────────────────────────────────

// GET /api/events
export const getEvents = asyncHandler(async (req, res) => {
  const { upcoming, club, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };

  if (upcoming === "true") filter.eventDate = { $gte: new Date() };
  if (club) filter.club = club;

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate("organizer", "name role")
      .populate("club", "name category")
      .sort({ eventDate: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Event.countDocuments(filter),
  ]);

  // Attach registration count and user's own registration status
  const eventIds = events.map((e) => e._id);
  const [registrations, userRegs] = await Promise.all([
    EventRegistration.aggregate([
      { $match: { event: { $in: eventIds }, status: "registered" } },
      { $group: { _id: "$event", count: { $sum: 1 } } },
    ]),
    EventRegistration.find({ event: { $in: eventIds }, user: req.user._id }),
  ]);

  const countMap = {};
  registrations.forEach((r) => { countMap[r._id.toString()] = r.count; });
  const regMap = {};
  userRegs.forEach((r) => { regMap[r.event.toString()] = r.status; });

  const withMeta = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap[e._id.toString()] || 0,
    myRegistration: regMap[e._id.toString()] || null,
  }));

  res.status(200).json({ success: true, total, page: Number(page), events: withMeta });
});

// POST /api/events  (faculty and admin)
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, club, eventDate, venue, maxParticipants, registrationDeadline, category } = req.body;

  if (!title || !eventDate) {
    return res.status(400).json({ success: false, message: "Title and event date are required." });
  }

  const event = await Event.create({
    title,
    description,
    club: club || null,
    organizer: req.user._id,
    eventDate,
    venue,
    maxParticipants: maxParticipants || 0,
    registrationDeadline: registrationDeadline || null,
    category: category || "other",
  });

  res.status(201).json({ success: true, message: "Event created.", event });
});

// PUT /api/events/:id  (organizer or admin)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found." });

  const isOrganizer = event.organizer.toString() === req.user._id.toString();
  if (!isOrganizer && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  const allowed = ["title", "description", "eventDate", "venue", "maxParticipants", "registrationDeadline", "category", "isActive"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: "Event updated.", event: updated });
});

// POST /api/events/:id/register  (any authenticated user)
export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isActive) {
    return res.status(404).json({ success: false, message: "Event not found." });
  }

  // Check registration deadline
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return res.status(400).json({ success: false, message: "Registration deadline has passed." });
  }

  // Check capacity if a limit is set
  if (event.maxParticipants > 0) {
    const count = await EventRegistration.countDocuments({
      event: event._id,
      status: "registered",
    });
    if (count >= event.maxParticipants) {
      return res.status(409).json({ success: false, message: "Event is at full capacity." });
    }
  }

  try {
    // findOneAndUpdate with upsert handles both new registration and reactivating a cancelled one
    const reg = await EventRegistration.findOneAndUpdate(
      { event: req.params.id, user: req.user._id },
      { status: "registered", registeredAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, message: "Registered for event.", registration: reg });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Already registered for this event." });
    }
    throw err;
  }
});

// DELETE /api/events/:id/cancel-registration
export const cancelEventRegistration = asyncHandler(async (req, res) => {
  const reg = await EventRegistration.findOneAndUpdate(
    { event: req.params.id, user: req.user._id, status: "registered" },
    { status: "cancelled" },
    { new: true }
  );

  if (!reg) {
    return res.status(404).json({ success: false, message: "No active registration found." });
  }

  res.status(200).json({ success: true, message: "Registration cancelled.", registration: reg });
});
