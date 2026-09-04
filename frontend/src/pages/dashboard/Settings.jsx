import React, { useState } from "react";
import { Sun, Moon, LogOut, User, Mail, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import api from "../../api/axios.js";

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
