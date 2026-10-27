import React, { useEffect, useState } from "react";
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";
import { roomAPI } from "../../services/api.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, Button,
  Input, Textarea, Select, ConfirmDialog, Card,
} from "../../components/UI.jsx";
import { getErrorMessage } from "../../utils/helpers.js";

const RoomForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(
    initial || { name: "", type: "classroom", capacity: "", location: "", description: "", facilities: "" }
  );
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    // Convert facilities string to array
    const data = {
      ...form,
      facilities: form.facilities ? form.facilities.split(",").map((f) => f.trim()).filter(Boolean) : [],
    };
    onSave(data);
  };

  return (
    <Card className="p-5 space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700">{initial ? "Edit Room" : "Add New Room"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Room Name" name="name" value={form.name} onChange={set} required placeholder="e.g. CS-101" />
        <Select label="Type" name="type" value={form.type} onChange={set}>
          <option value="classroom">Classroom</option>
          <option value="laboratory">Laboratory</option>
          <option value="seminar_hall">Seminar Hall</option>
          <option value="conference_room">Conference Room</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Capacity" type="number" name="capacity" value={form.capacity} onChange={set} required />
        <Input label="Location / Block" name="location" value={form.location} onChange={set} placeholder="e.g. Block A, 2nd Floor" />
      </div>
      <Input
        label="Facilities (comma-separated)"
        name="facilities"
        value={typeof form.facilities === "string" ? form.facilities : form.facilities?.join(", ")}
        onChange={set}
        placeholder="e.g. Projector, AC, Computers"
      />
      <Textarea label="Description (optional)" name="description" value={form.description} onChange={set} rows={2} />
      <div className="flex gap-2">
        <Button onClick={handleSave} loading={loading}>Save Room</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await roomAPI.update(editTarget._id, form);
      } else {
        await roomAPI.create(form);
      }
      setShowForm(false);
      setEditTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await roomAPI.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const typeColor = { classroom: "blue", laboratory: "green", seminar_hall: "purple", conference_room: "orange" };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" /> Room Management
        </h1>
        {!showForm && !editTarget && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Room
          </Button>
        )}
      </div>

      <ErrorMessage message={error} />

      {showForm && !editTarget && (
        <RoomForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}
      {editTarget && (
        <RoomForm
          initial={{ ...editTarget, facilities: editTarget.facilities?.join(", ") || "" }}
          onSave={handleSave}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      )}

      {loading ? (
        <PageLoader />
      ) : rooms.length === 0 ? (
        <EmptyState icon={Building2} title="No rooms added" description="Add rooms so students can book them." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room._id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{room.name}</h3>
                  <span className={`text-xs capitalize font-medium text-${typeColor[room.type] || "gray"}-600`}>
                    {room.type.replace("_", " ")}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {room.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 mb-3">
                <p>👥 Capacity: {room.capacity}</p>
                {room.location && <p>📍 {room.location}</p>}
                {room.facilities?.length > 0 && (
                  <p>🛠 {room.facilities.join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button size="sm" variant="secondary" onClick={() => setEditTarget(room)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(room)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete room "${deleteTarget?.name}"? All bookings for this room will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
};

export default AdminRooms;
