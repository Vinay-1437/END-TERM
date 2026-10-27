import React, { useEffect, useState } from "react";
import { Search, Plus, CheckCircle, Trash2, Edit2 } from "lucide-react";
import { lostFoundAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, SuccessToast,
  Button, Input, Textarea, Select, ConfirmDialog, Card,
} from "../../components/UI.jsx";
import { formatDate, getErrorMessage, getStatusColor } from "../../utils/helpers.js";

const LostFoundForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(
    initial || { itemName: "", description: "", type: "lost", location: "", date: "", contactInfo: "" }
  );
  const [image, setImage] = useState(null);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);
    onSave(fd, !!initial);
  };

  return (
    <Card className="p-5 space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700">{initial ? "Edit Post" : "New Lost & Found Post"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Item Name" name="itemName" value={form.itemName} onChange={set} required />
        <Select label="Type" name="type" value={form.type} onChange={set}>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </Select>
      </div>
      <Textarea label="Description" name="description" value={form.description} onChange={set} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Location" name="location" value={form.location} onChange={set} placeholder="Where was it lost/found?" />
        <Input label="Date" type="date" name="date" value={form.date} onChange={set} required />
      </div>
      <Input label="Contact Info (optional)" name="contactInfo" value={form.contactInfo} onChange={set} placeholder="Email or phone" />
      {!initial && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="text-sm text-slate-600 border border-slate-300 rounded-lg p-2"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} loading={loading}>Save Post</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { status: statusFilter };
      if (typeFilter !== "all") params.type = typeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await lostFoundAPI.getAll(params);
      setItems(res.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const handleSave = async (formData, isEdit) => {
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        // For edits, send plain JSON (no new image)
        const plain = {};
        formData.forEach((v, k) => { plain[k] = v; });
        await lostFoundAPI.update(editTarget._id, plain);
      } else {
        await lostFoundAPI.create(formData);
      }
      setSuccess("Post saved successfully!");
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await lostFoundAPI.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await lostFoundAPI.resolve(id);
      setSuccess("Marked as resolved!");
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-6 h-6 text-teal-600" /> Lost & Found
        </h1>
        {!showForm && !editTarget && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Post
          </Button>
        )}
      </div>

      <SuccessToast message={success} />
      <ErrorMessage message={error} />

      {showForm && !editTarget && (
        <LostFoundForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}
      {editTarget && (
        <LostFoundForm
          initial={{ ...editTarget, date: editTarget.date?.slice(0, 10) || "" }}
          onSave={handleSave}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Go</Button>
        </form>

        {["all", "lost", "found"].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${typeFilter === t ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {t === "all" ? "All Types" : t}
          </button>
        ))}

        {["active", "resolved"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${statusFilter === s ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No posts found" description="Try adjusting filters or create a new post." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isOwner = item.postedBy?._id === user._id;
            return (
              <Card key={item._id} className="overflow-hidden hover:shadow-md transition">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.itemName} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{item.itemName}</h3>
                    <div className="flex gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === "lost" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {item.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                  {item.location && <p className="text-xs text-slate-400 mb-1">📍 {item.location}</p>}
                  <p className="text-xs text-slate-400 mb-1">📅 {formatDate(item.date)}</p>
                  <p className="text-xs text-slate-400">By: {item.postedBy?.name}</p>

                  {(isOwner || isAdmin) && item.status === "active" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      {isOwner && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setEditTarget(item)}>
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="success" onClick={() => handleResolve(item._id)}>
                            <CheckCircle className="w-3 h-3" /> Resolve
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete post for "${deleteTarget?.itemName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
};

export default LostFound;
