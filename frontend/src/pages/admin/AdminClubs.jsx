import React, { useEffect, useState } from "react";
import { Users, Plus, Edit2 } from "lucide-react";
import { clubAPI, userAPI } from "../../services/api.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, Button,
  Input, Textarea, Select, Card, SuccessToast,
} from "../../components/UI.jsx";
import { getErrorMessage } from "../../utils/helpers.js";

const ClubForm = ({ faculties, initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(
    initial || { name: "", description: "", category: "other", managedBy: "" }
  );
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Card className="p-5 space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700">{initial ? "Edit Club" : "Add New Club"}</h3>
      <Input label="Club Name" name="name" value={form.name} onChange={set} required />
      <Textarea label="Description" name="description" value={form.description} onChange={set} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" name="category" value={form.category} onChange={set}>
          {["technical", "cultural", "sports", "social", "academic", "other"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Faculty Manager (optional)" name="managedBy" value={form.managedBy} onChange={set}>
          <option value="">None</option>
          {faculties.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </Select>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} loading={loading}>Save</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const AdminClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [clubRes, userRes] = await Promise.all([
        clubAPI.getAll(),
        userAPI.getAllUsers({ role: "faculty" }),
      ]);
      setClubs(clubRes.data.clubs);
      setFaculties(userRes.data.users);
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
        await clubAPI.update(editTarget._id, form);
        setSuccess("Club updated.");
      } else {
        await clubAPI.create(form);
        setSuccess("Club created!");
      }
      setShowForm(false);
      setEditTarget(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" /> Club Management
        </h1>
        {!showForm && !editTarget && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Club
          </Button>
        )}
      </div>

      <SuccessToast message={success} />
      <ErrorMessage message={error} />

      {showForm && !editTarget && (
        <ClubForm faculties={faculties} onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}
      {editTarget && (
        <ClubForm
          faculties={faculties}
          initial={{ ...editTarget, managedBy: editTarget.managedBy?._id || "" }}
          onSave={handleSave}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      )}

      {loading ? (
        <PageLoader />
      ) : clubs.length === 0 ? (
        <EmptyState icon={Users} title="No clubs yet" description="Add your first club." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <Card key={club._id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{club.name}</h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">
                  {club.category}
                </span>
              </div>
              {club.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{club.description}</p>
              )}
              {club.managedBy && (
                <p className="text-xs text-slate-400 mb-3">Managed by: {club.managedBy.name}</p>
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditTarget(club)}>
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default AdminClubs;
