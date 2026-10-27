import React, { useEffect, useState } from "react";
import { Users, Calendar, UserPlus, UserMinus, Plus } from "lucide-react";
import { clubAPI, eventAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, SuccessToast,
  Button, Input, Textarea, Select, ConfirmDialog, Card,
} from "../../components/UI.jsx";
import { formatDate, getErrorMessage } from "../../utils/helpers.js";

const EventForm = ({ clubs, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    title: "", description: "", club: "", eventDate: "",
    venue: "", maxParticipants: 0, registrationDeadline: "", category: "other"
  });
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <Card className="p-5 space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700">Create New Event</h3>
      <Input label="Title" name="title" value={form.title} onChange={set} required />
      <Textarea label="Description" name="description" value={form.description} onChange={set} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" name="category" value={form.category} onChange={set}>
          {["workshop", "seminar", "competition", "social", "sports", "other"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Club (optional)" name="club" value={form.club} onChange={set}>
          <option value="">No club</option>
          {clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Event Date" type="datetime-local" name="eventDate" value={form.eventDate} onChange={set} required />
        <Input label="Registration Deadline" type="datetime-local" name="registrationDeadline" value={form.registrationDeadline} onChange={set} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Venue" name="venue" value={form.venue} onChange={set} />
        <Input label="Max Participants (0 = unlimited)" type="number" name="maxParticipants" value={form.maxParticipants} onChange={set} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} loading={loading}>Create Event</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const ClubsAndEvents = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("clubs");
  const [showEventForm, setShowEventForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);

  const canManage = user?.role === "faculty" || user?.role === "admin";
  const isStudent = user?.role === "student";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [clubRes, eventRes] = await Promise.all([
        clubAPI.getAll(),
        eventAPI.getAll({ upcoming: "true" }),
      ]);
      setClubs(clubRes.data.clubs);
      setEvents(eventRes.data.events);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleJoinLeave = async (club) => {
    setJoiningId(club._id);
    setError("");
    try {
      if (club.isMember) {
        await clubAPI.leave(club._id);
        setSuccess(`Left ${club.name}.`);
      } else {
        await clubAPI.join(club._id);
        setSuccess(`Joined ${club.name}!`);
      }
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoiningId(null);
    }
  };

  const handleRegisterCancel = async (event) => {
    setRegisteringId(event._id);
    setError("");
    try {
      if (event.myRegistration === "registered") {
        await eventAPI.cancelRegistration(event._id);
        setSuccess("Registration cancelled.");
      } else {
        await eventAPI.register(event._id);
        setSuccess(`Registered for ${event.title}!`);
      }
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCreateEvent = async (form) => {
    setSaving(true);
    setError("");
    try {
      await eventAPI.create(form);
      setSuccess("Event created!");
      setShowEventForm(false);
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clubs & Events</h1>
        {canManage && tab === "events" && !showEventForm && (
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="w-4 h-4" /> Create Event
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {["clubs", "events"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "clubs" ? <><Users className="inline w-4 h-4 mr-1" />Clubs</> : <><Calendar className="inline w-4 h-4 mr-1" />Events</>}
          </button>
        ))}
      </div>

      <SuccessToast message={success} />
      <ErrorMessage message={error} />

      {tab === "events" && showEventForm && (
        <EventForm clubs={clubs} onSave={handleCreateEvent} onCancel={() => setShowEventForm(false)} loading={saving} />
      )}

      {loading ? (
        <PageLoader />
      ) : tab === "clubs" ? (
        // ── Clubs grid ──────────────────────────────────────────────────────
        clubs.length === 0 ? (
          <EmptyState icon={Users} title="No clubs yet" description="Admin will add clubs soon." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <Card key={club._id} className="p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{club.name}</h3>
                    <span className="text-xs text-slate-400 capitalize">{club.category}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">
                    {club.category}
                  </span>
                </div>
                {club.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{club.description}</p>
                )}
                {club.managedBy && (
                  <p className="text-xs text-slate-400 mb-3">Managed by: {club.managedBy.name}</p>
                )}
                {isStudent && (
                  <Button
                    size="sm"
                    variant={club.isMember ? "secondary" : "primary"}
                    loading={joiningId === club._id}
                    onClick={() => handleJoinLeave(club)}
                    className="w-full"
                  >
                    {club.isMember ? (
                      <><UserMinus className="w-3.5 h-3.5" /> Leave Club</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Join Club</>
                    )}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        // ── Events list ──────────────────────────────────────────────────────
        events.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming events" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((event) => {
              const isRegistered = event.myRegistration === "registered";
              const isFull = event.maxParticipants > 0 && event.registeredCount >= event.maxParticipants;
              return (
                <Card key={event._id} className="p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full capitalize shrink-0">
                      {event.category}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{event.description}</p>
                  )}
                  <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                    <p>📅 {formatDate(event.eventDate)}</p>
                    {event.venue && <p>📍 {event.venue}</p>}
                    {event.club && <p>🏛️ {event.club.name}</p>}
                    <p>👥 {event.registeredCount}{event.maxParticipants > 0 ? `/${event.maxParticipants}` : ""} registered</p>
                  </div>
                  {isRegistered ? (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={registeringId === event._id}
                      onClick={() => handleRegisterCancel(event)}
                      className="w-full"
                    >
                      Cancel Registration
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isFull ? "secondary" : "primary"}
                      disabled={isFull}
                      loading={registeringId === event._id}
                      onClick={() => !isFull && handleRegisterCancel(event)}
                      className="w-full"
                    >
                      {isFull ? "Event Full" : "Register"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}
    </MainLayout>
  );
};

export default ClubsAndEvents;
