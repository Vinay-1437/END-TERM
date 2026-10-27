import React, { useEffect, useState } from "react";
import { Building2, Plus, Calendar } from "lucide-react";
import { roomAPI, bookingAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, SuccessToast,
  Button, Input, Select, ConfirmDialog, Card, StatCard,
} from "../../components/UI.jsx";
import { formatDate, getErrorMessage, getStatusColor } from "../../utils/helpers.js";

const BookingForm = ({ rooms, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ roomId: "", date: "", startTime: "", endTime: "", purpose: "" });
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Card className="p-5 space-y-3 mb-6 border-blue-200 bg-blue-50">
      <h3 className="font-semibold text-slate-700">New Room Booking</h3>
      <Select label="Select Room" name="roomId" value={form.roomId} onChange={set} required>
        <option value="">Choose a room...</option>
        {rooms.map((r) => (
          <option key={r._id} value={r._id}>
            {r.name} — {r.type} (Cap: {r.capacity})
          </option>
        ))}
      </Select>
      <Input label="Date" type="date" name="date" value={form.date} onChange={set} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Time" type="time" name="startTime" value={form.startTime} onChange={set} required />
        <Input label="End Time" type="time" name="endTime" value={form.endTime} onChange={set} required />
      </div>
      <Input label="Purpose" name="purpose" value={form.purpose} onChange={set} placeholder="e.g. Group study session" required />
      <div className="flex gap-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>Submit Request</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const Bookings = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const [roomRes, bookRes] = await Promise.all([
        roomAPI.getAll(),
        bookingAPI.getAll(params),
      ]);
      setRooms(roomRes.data.rooms);
      setBookings(bookRes.data.bookings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleSubmit = async (form) => {
    setSaving(true);
    setError("");
    try {
      await bookingAPI.create(form);
      setSuccess("Booking request submitted! Awaiting admin approval.");
      setShowForm(false);
      load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingAPI.cancel(cancelTarget._id);
      setCancelTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleApproveReject = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" />
          {isAdmin ? "All Bookings" : "Room Bookings"}
        </h1>
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {!isAdmin && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Book Room
            </Button>
          )}
        </div>
      </div>

      <SuccessToast message={success} />
      <ErrorMessage message={error} />

      {showForm && (
        <BookingForm
          rooms={rooms.filter((r) => r.isAvailable)}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {loading ? (
        <PageLoader />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No bookings"
          description={isAdmin ? "No bookings to display." : "Book a room to get started."}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b._id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{b.room?.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{b.purpose}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
                    <span><Calendar className="inline w-3 h-3 mr-0.5" />{formatDate(b.date)}</span>
                    <span>{b.startTime} – {b.endTime}</span>
                    {isAdmin && b.bookedBy && <span>By: {b.bookedBy.name} ({b.bookedBy.role})</span>}
                    {b.room?.type && <span className="capitalize">{b.room.type}</span>}
                  </div>
                  {b.adminNote && <p className="text-xs text-slate-500 mt-1 italic">Note: {b.adminNote}</p>}
                </div>

                <div className="flex gap-2 shrink-0">
                  {/* Admin approve/reject */}
                  {isAdmin && b.status === "pending" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleApproveReject(b._id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleApproveReject(b._id, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                  {/* Owner cancel */}
                  {!isAdmin && ["pending", "approved"].includes(b.status) && (
                    <Button size="sm" variant="danger" onClick={() => setCancelTarget(b)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        message={`Cancel booking for ${cancelTarget?.room?.name} on ${formatDate(cancelTarget?.date)}?`}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={cancelling}
      />
    </MainLayout>
  );
};

export default Bookings;
