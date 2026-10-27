import React, { useEffect, useState } from "react";
import { BookOpen, Plus, CheckCircle, Clock, AlertCircle, Filter } from "lucide-react";
import { assignmentAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  PageLoader, EmptyState, ErrorMessage, Button,
  Input, Textarea, Select, ConfirmDialog, Card,
} from "../../components/UI.jsx";
import { formatDate, getErrorMessage, isOverdue, getStatusColor } from "../../utils/helpers.js";

/* ── Small sub-component: create/edit form ── */
const AssignmentForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(
    initial || { title: "", description: "", subject: "", deadline: "", targetDepartment: "", maxMarks: 100 }
  );

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-slate-700">{initial ? "Edit Assignment" : "New Assignment"}</h3>
      <Input label="Title" name="title" value={form.title} onChange={set} required />
      <Textarea label="Description" name="description" value={form.description} onChange={set} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Subject" name="subject" value={form.subject} onChange={set} required />
        <Input label="Deadline" type="datetime-local" name="deadline" value={form.deadline} onChange={set} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Target Department (optional)" name="targetDepartment" value={form.targetDepartment} onChange={set} />
        <Input label="Max Marks" type="number" name="maxMarks" value={form.maxMarks} onChange={set} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(form)} loading={loading}>Save</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

/* ── Main page ── */
const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const load = async (status) => {
    setLoading(true);
    try {
      const params = status && status !== "all" ? { status } : {};
      const res = await assignmentAPI.getAll(params);
      setAssignments(res.data.assignments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const handleSave = async (form) => {
    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await assignmentAPI.update(editTarget._id, form);
      } else {
        await assignmentAPI.create(form);
      }
      setShowForm(false);
      setEditTarget(null);
      load(statusFilter);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await assignmentAPI.remove(deleteTarget._id);
      setDeleteTarget(null);
      load(statusFilter);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusToggle = async (assignment) => {
    const newStatus = assignment.myStatus === "completed" ? "pending" : "completed";
    setStatusUpdating(assignment._id);
    try {
      await assignmentAPI.updateMyStatus(assignment._id, newStatus);
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignment._id ? { ...a, myStatus: newStatus } : a
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatusUpdating(null);
    }
  };

  const isFaculty = user?.role === "faculty" || user?.role === "admin";

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Assignments
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isFaculty ? "Manage your assignments" : "Track your pending and completed work"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter (students only) */}
          {!isFaculty && (
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
          )}

          {isFaculty && !showForm && (
            <Button onClick={() => { setShowForm(true); setEditTarget(null); }}>
              <Plus className="w-4 h-4" /> New Assignment
            </Button>
          )}
        </div>
      </div>

      <ErrorMessage message={error} />

      {(showForm && !editTarget) && (
        <div className="mb-6">
          <AssignmentForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            loading={saving}
          />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments found"
          description={isFaculty ? "Click 'New Assignment' to create one." : "No assignments match the selected filter."}
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const overdue = !isFaculty && a.myStatus === "pending" && isOverdue(a.deadline);
            const statusLabel = overdue ? "overdue" : (isFaculty ? "active" : a.myStatus);
            const isEditing = editTarget?._id === a._id;

            return (
              <div key={a._id}>
                {isEditing && (
                  <div className="mb-2">
                    <AssignmentForm
                      initial={{
                        ...editTarget,
                        deadline: editTarget.deadline?.slice(0, 16),
                      }}
                      onSave={handleSave}
                      onCancel={() => setEditTarget(null)}
                      loading={saving}
                    />
                  </div>
                )}

                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{a.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(statusLabel)}`}>
                          {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        <span>Subject: <strong className="text-slate-600">{a.subject}</strong></span>
                        {a.createdBy && <span>By: <strong className="text-slate-600">{a.createdBy.name}</strong></span>}
                        <span>Max Marks: <strong className="text-slate-600">{a.maxMarks}</strong></span>
                        {a.targetDepartment && <span>Dept: <strong className="text-slate-600">{a.targetDepartment}</strong></span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className={`text-sm font-medium ${overdue ? "text-red-500" : "text-slate-600"}`}>
                        Due: {formatDate(a.deadline)}
                      </p>

                      {/* Student: mark complete toggle */}
                      {!isFaculty && (
                        <button
                          onClick={() => handleStatusToggle(a)}
                          disabled={statusUpdating === a._id}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            a.myStatus === "completed"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {statusUpdating === a._id ? "Saving..." : a.myStatus === "completed" ? "Completed" : "Mark Complete"}
                        </button>
                      )}

                      {/* Faculty: edit / delete */}
                      {isFaculty && a.createdBy?._id === user._id && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditTarget(a)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>Delete</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
};

export default Assignments;
