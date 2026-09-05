import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame, CheckCircle2, CalendarDays, ListChecks, BarChart3, BellRing,
  BookOpen, Menu, X, ArrowRight, Moon, Sun, Sparkles,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Preview", href: "#preview" },
];

const features = [
  { icon: CalendarDays, title: "One combined monthly grid", desc: "Every habit, every day of the month, in a single GitHub-style matrix. No more clicking between five separate charts to see how your month went." },
  { icon: ListChecks, title: "A task manager, kept separate", desc: "A simple to-do list for one-off tasks — completely independent from your habits, so it never touches your streaks or completion stats." },
  { icon: Flame, title: "Streaks that actually motivate", desc: "Current and longest streaks are calculated per habit, factoring in daily, weekly and custom schedules." },
  { icon: BarChart3, title: "Analytics without the clutter", desc: "A 30-day trend, monthly completion rate, and per-habit breakdown — enough to see progress, not so much you drown in charts." },
  { icon: BookOpen, title: "A daily journal, built in", desc: "Log your mood and a few lines each day, right next to the habits that shaped it." },
  { icon: BellRing, title: "Reminders that stick", desc: "Set a time and the days it applies to, and Habitly keeps a running list so nothing quietly slips." },
];

const steps = [
  { title: "Add your habits", desc: "Name it, pick a color, choose daily, weekly or custom days." },
  { title: "Check them off", desc: "Tap a cell in today's list or the monthly grid to mark it complete." },
  { title: "Watch the grid fill in", desc: "Streaks, goals and analytics update automatically as you go." },
];

const ThemeToggleButton = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 rounded-full flex items-center justify-center border border-ink-900/10 dark:border-white/15 text-ink-900/70 dark:text-ink-50/70 hover:bg-ink-900/5 dark:hover:bg-white/10 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
};

const Navbar = ({ onMenu }) => (
  <header className="sticky top-0 z-40 backdrop-blur-md bg-ink-50/80 dark:bg-ink-950/80 border-b border-ink-900/5 dark:border-white/5">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Flame size={17} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">Habitly</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-900/70 dark:text-ink-50/70">
        {nav.map((n) => (
          <a key={n.href} href={n.href} className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
            {n.label}
          </a>
        ))}
      </nav>
      <div className="hidden md:flex items-center gap-3">
        <ThemeToggleButton />
        <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full hover:bg-ink-900/5 dark:hover:bg-white/5 transition-colors">
          Log in
        </Link>
        <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-soft">
          Get started free
        </Link>
      </div>
      <div className="flex items-center gap-1 md:hidden">
        <ThemeToggleButton />
        <button className="p-2" onClick={onMenu} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
      </div>
    </div>
  </header>
);

const MobileMenu = ({ open, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 h-full w-72 bg-white dark:bg-ink-900 shadow-xl p-6 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button onClick={onClose} className="mb-8 p-2 -ml-2" aria-label="Close menu">
          <X size={22} />
        </button>
        <div className="flex flex-col gap-5 text-base font-medium">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={onClose}>{n.label}</a>
          ))}
          <hr className="border-ink-900/10 dark:border-white/10" />
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between px-1 py-1 text-ink-900/80 dark:text-ink-50/80"
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
            <span className="text-xs font-semibold text-ink-900/40 dark:text-ink-50/40 capitalize">{theme}</span>
          </button>
          <hr className="border-ink-900/10 dark:border-white/10" />
          <Link to="/login" onClick={onClose}>Log in</Link>
          <Link
            to="/register"
            onClick={onClose}
            className="text-center px-4 py-3 rounded-full bg-brand-500 text-white font-semibold"
          >
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
};

// A miniature, purely decorative version of the signature monthly matrix
const MiniMatrix = () => {
  const rows = ["Meditation", "Workout", "Reading", "Water", "DSA"];
  const seed = [
    [1,1,0,1,1,0,1,1,1,0,1,1],
    [0,1,1,0,1,1,0,1,1,1,0,1],
    [1,1,0,1,1,1,1,0,1,1,1,0],
    [1,0,1,1,1,0,1,1,0,1,1,1],
    [1,1,1,1,0,1,1,0,1,1,0,1],
  ];
  return (
    <div className="rounded-2xl bg-white dark:bg-ink-900 shadow-card border border-ink-900/5 dark:border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-ink-900/60 dark:text-ink-50/60">September · monthly grid</p>
        <Sparkles size={16} className="text-brand-500" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "clamp(56px, 22vw, 84px) repeat(12, 1fr)", rowGap: "8px", columnGap: "4px" }}>
        <div />
        {seed[0].map((_, i) => (
          <div key={i} className="text-[10px] text-center text-ink-900/40 dark:text-ink-50/40">{i + 1}</div>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <div className="text-[11px] sm:text-xs font-medium text-ink-900/70 dark:text-ink-50/70 pr-1.5 flex items-center truncate">{r}</div>
            {seed[ri].map((v, ci) => (
              <div
                key={ci}
                className={`aspect-square rounded-[5px] ${v ? "bg-brand-500" : "bg-ink-900/10 dark:bg-white/10"}`}
                style={{ opacity: v ? 0.55 + (ci % 4) * 0.15 : 1 }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50 overflow-x-hidden">
      <Navbar onMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Hero */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-5 sm:px-8 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-full">
              <Flame size={13} /> Built for people who track more than one habit
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] font-bold mt-5 tracking-tight">
              See your whole month of habits, in one grid.
            </h1>
            <p className="mt-5 text-lg text-ink-900/65 dark:text-ink-50/65 max-w-lg">
              Habitly replaces a wall of separate habit charts with a single combined matrix — habits down the side, days across the top, tap to check off. Streaks, goals and a drag-and-drop board come with it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-soft"
              >
                Start tracking free <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold border border-ink-900/10 dark:border-white/15 hover:bg-ink-900/5 dark:hover:bg-white/5 transition-colors"
              >
                I already have an account
              </Link>
            </div>
            <p className="mt-6 text-xs text-ink-900/40 dark:text-ink-50/40">No credit card. Your data stays yours, tied to your account only.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            <MiniMatrix />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-5 sm:px-8 bg-white dark:bg-ink-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Everything a habit needs, nothing it doesn't</h2>
            <p className="mt-3 text-ink-900/60 dark:text-ink-50/60">Six pieces that work together instead of six separate apps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-ink-50 dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 hover:border-brand-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                  <f.icon size={19} className="text-brand-600 dark:text-brand-300" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-900/60 dark:text-ink-50/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Three steps in, and you're tracking</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="text-5xl font-display font-bold text-brand-500/25 mb-3">{i + 1}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-ink-900/60 dark:text-ink-50/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview strip */}
      <section id="preview" className="py-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-ink-900 to-brand-900 dark:from-ink-900 dark:to-brand-950 p-8 sm:p-12 text-white grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-brand-200 mb-3">
              <Moon size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Light & dark, both designed</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3">A dashboard that feels calm, not corporate</h3>
            <p className="text-white/70 text-sm leading-relaxed">Rounded cards, soft shadows and a single accent color, tuned for daily use — on desktop with a sidebar, on mobile with a real app-style bottom nav.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {["Today's progress, streak and monthly percentage at a glance", "A Task Manager kept separate from your habits", "Journal entries tied to each day"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 size={17} className="text-brand-300 mt-0.5 shrink-0" />
                <span className="text-white/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">Start your first streak today</h2>
          <p className="text-ink-900/60 dark:text-ink-50/60 mb-8">It takes under a minute to add your first habit.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-soft"
          >
            Create your free account <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-900/10 dark:border-white/10 py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Flame size={14} className="text-white" />
            </div>
            <span className="font-display font-semibold">Habitly</span>
          </div>
          <p className="text-xs text-ink-900/40 dark:text-ink-50/40">© {new Date().getFullYear()} Habitly. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
