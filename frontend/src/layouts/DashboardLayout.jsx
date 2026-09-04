import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home, CalendarDays, ListChecks, Target, BarChart3, BookOpen, BellRing,
  Award, Settings as SettingsIcon, Flame, Sun, Moon, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const sidebarLinks = [
  { to: "/app", label: "Dashboard", icon: Home, end: true },
  { to: "/app/matrix", label: "Monthly Matrix", icon: CalendarDays },
  { to: "/app/board", label: "Task Manager", icon: ListChecks },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/journal", label: "Journal", icon: BookOpen },
  { to: "/app/reminders", label: "Reminders", icon: BellRing },
  { to: "/app/achievements", label: "Achievements", icon: Award },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

const bottomNavLinks = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/matrix", label: "Matrix", icon: CalendarDays },
  { to: "/app/board", label: "Tasks", icon: ListChecks },
  { to: "/app/analytics", label: "Stats", icon: BarChart3 },
  { to: "/app/settings", label: "More", icon: SettingsIcon },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-ink-900/8 dark:border-white/8 bg-white dark:bg-ink-900 px-4 py-6 z-30">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Flame size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">Habitly</span>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "text-ink-900/60 dark:text-ink-50/60 hover:bg-ink-900/5 dark:hover:bg-white/5"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-900/8 dark:border-white/8 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: user?.avatarColor || "#6C63F2" }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-ink-900/45 dark:text-ink-50/45 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-900/60 dark:text-ink-50/60 hover:bg-ink-900/5 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={doLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top app bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md border-b border-ink-900/8 dark:border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Flame size={14} className="text-white" />
          </div>
          <span className="font-display font-bold">Habitly</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button onClick={() => setMobileNavOpen(true)} className="p-2" aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile slide-out menu (full link list + logout) */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileNavOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white dark:bg-ink-900 shadow-xl p-5 transition-transform duration-300 overflow-y-auto ${
            mobileNavOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ backgroundColor: user?.avatarColor || "#6C63F2" }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-ink-900/45 dark:text-ink-50/45 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="shrink-0"><X size={20} /></button>
          </div>
          <nav className="space-y-1">
            {sidebarLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? "bg-brand-500/10 text-brand-700 dark:text-brand-300" : "text-ink-900/70 dark:text-ink-50/70"
                  }`
                }
              >
                <l.icon size={18} /> {l.label}
              </NavLink>
            ))}
            <button
              onClick={doLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 mt-2"
            >
              <LogOut size={18} /> Log out
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64 pb-20 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-t border-ink-900/8 dark:border-white/8 flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {bottomNavLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium ${
                isActive ? "text-brand-600 dark:text-brand-300" : "text-ink-900/45 dark:text-ink-50/45"
              }`
            }
          >
            <l.icon size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
