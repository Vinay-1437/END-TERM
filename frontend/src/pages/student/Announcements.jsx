import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, Search, ChevronRight } from "lucide-react";
import { announcementAPI } from "../../services/api.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, Button,
  Input, Textarea, Select, ConfirmDialog, Card,
} from "../../components/UI.jsx";
import { formatDate, timeAgo, getErrorMessage } from "../../utils/helpers.js";

const CATEGORIES = ["all", "academic", "event", "general", "urgent", "facility"];
const categoryColor = { academic: "blue", event: "green", urgent: "red", facility: "purple", general: "gray" };

const AnnouncementForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(
    initial || { title: "", description: "", category: "general", expiresAt: "" }
  );
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Card className="p-5 space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700">{initial ? "Edit Announcement" : "New Announcement"}</h3>
      <Input label="Title" name="title" value={form.title} onChange={set} required />
      <Textarea label="Description" name="description" value={form.description} onChange={set} required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" name="category" value={form.category} onChange={set}>
          {["general", "academic", "event", "urgent", "facility"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </Select>
        <Input label="Expires At (optional)" type="date" name="expiresAt" value={form.expiresAt} onChange={set} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} loading={loading}>Publish</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const Announcements = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canPost = user?.role === "faculty" || user?.role === "admin";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (category !== "all") params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await announcementAPI.getAll(params);
      setItems(res.data.announcements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleSave = async (form) => {
    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await announcementAPI.update(editTarget._id, form);
      } else {
        await announcementAPI.create(form);
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
      await announcementAPI.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-orange-500" /> Announcements
        </h1>
        {canPost && !showForm && (
          <Button onClick={() => { setShowForm(true); setEditTarget(null); }}>
            + New Announcement
          </Button>
        )}
      </div>

      {(showForm && !editTarget) && (
        <AnnouncementForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}

      <ErrorMessage message={error} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Nothing posted yet in this category." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const isEditing = editTarget?._id === a._id;
            return (
              <div key={a._id}>
                {isEditing && (
                  <AnnouncementForm
                    initial={{ title: a.title, description: a.description, category: a.category, expiresAt: a.expiresAt?.slice(0, 10) || "" }}
                    onSave={handleSave}
                    onCancel={() => setEditTarget(null)}
                    loading={saving}
                  />
                )}
                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${categoryColor[a.category] || "gray"}-100 text-${categoryColor[a.category] || "gray"}-800`}>
                          {a.category}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-1">{a.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{a.description}</p>
                      <p className="text-xs text-slate-400 mt-2">By {a.author?.name} • {formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/announcements/${a._id}`} className="p-2 text-slate-400 hover:text-blue-600 transition">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  {canPost && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button size="sm" variant="secondary" onClick={() => setEditTarget(a)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>Delete</Button>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Remove "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
};

export default Announcements;
