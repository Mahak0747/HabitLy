import React, { useState } from "react";
import { Sun, Moon, LogOut, User, Mail, Palette, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import api from "../../api/axios.js";

const ChangePasswordCard = () => {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.newPassword, form.confirmNewPassword);
      setSuccess("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, showKey) => (
    <div>
      <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? "text" : "password"}
          required
          value={form[key]}
          onChange={update(key)}
          autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
          className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm pr-11"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-900/40 dark:text-ink-50/40"
          tabIndex={-1}
        >
          {show[showKey] ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
      <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2"><KeyRound size={15} /> Change password</h2>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 rounded-lg px-3 py-2.5">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {field("Current password", "currentPassword", "current")}
        {field("New password", "newPassword", "next")}
        {field("Confirm new password", "confirmNewPassword", "confirm")}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60"
        >
          {saving ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
};

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const chooseTheme = async (t) => {
    setTheme(t);
    setSaving(true);
    try {
      const { data } = await api.put("/auth/theme", { theme: t });
      setUser(data.user);
    } finally {
      setSaving(false);
    }
  };

  const doLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="space-y-6 pb-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">Your account and appearance preferences.</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
        <h2 className="font-display font-semibold text-sm mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ backgroundColor: user?.avatarColor }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="text-sm text-ink-900/50 dark:text-ink-50/50 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
        <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2"><Palette size={15} /> Appearance</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => chooseTheme("light")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
              theme === "light" ? "border-brand-500 bg-brand-500/10 text-brand-700" : "border-ink-900/10 dark:border-white/10 text-ink-900/60 dark:text-ink-50/60"
            }`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => chooseTheme("dark")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
              theme === "dark" ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-ink-900/10 dark:border-white/10 text-ink-900/60 dark:text-ink-50/60"
            }`}
          >
            <Moon size={16} /> Dark
          </button>
        </div>
      </div>

      <ChangePasswordCard />

      <button
        onClick={doLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/15 transition-colors"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
};

export default Settings;
