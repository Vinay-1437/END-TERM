import React, { useState } from "react";
import { User, Save } from "lucide-react";
import { userAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { Button, Input, Textarea, Select, ErrorMessage, SuccessToast, Card } from "../../components/UI.jsx";
import { getErrorMessage } from "../../utils/helpers.js";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    rollNumber: user?.rollNumber || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setPw = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setError("");
    try {
      await userAPI.changePassword(pwForm);
      setSuccess("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  const departments = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Chemical", "Mathematics", "Physics", "Other"];

  return (
    <MainLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <User className="w-6 h-6 text-blue-600" /> My Profile
        </h1>

        {/* Avatar / role card */}
        <Card className="p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-lg">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
              user?.role === "admin" ? "bg-purple-100 text-purple-700"
                : user?.role === "faculty" ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {user?.role}
            </span>
          </div>
        </Card>

        <SuccessToast message={success} />
        <ErrorMessage message={error} />

        {/* Profile edit form */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-slate-700 mb-4">Edit Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input label="Full Name" name="name" value={form.name} onChange={set} required />
            <Select label="Department" name="department" value={form.department} onChange={set}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            {user?.role === "student" && (
              <Input label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={set} />
            )}
            <Input label="Phone" name="phone" value={form.phone} onChange={set} placeholder="+91 XXXXX XXXXX" />
            <Textarea label="Bio" name="bio" value={form.bio} onChange={set} rows={3} placeholder="Tell us a bit about yourself..." />
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" /> Save Profile
            </Button>
          </form>
        </Card>

        {/* Change password */}
        <Card className="p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input label="Current Password" type="password" name="currentPassword" value={pwForm.currentPassword} onChange={setPw} required />
            <Input label="New Password" type="password" name="newPassword" value={pwForm.newPassword} onChange={setPw} placeholder="Minimum 6 characters" required />
            <Button type="submit" loading={pwSaving} variant="secondary">Change Password</Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;
