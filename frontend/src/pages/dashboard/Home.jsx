import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Flame, TrendingUp, Target, Quote, BellRing, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useHabits } from "../../context/HabitContext.jsx";
import HabitCard from "../../components/HabitCard.jsx";
import AddHabitModal from "../../components/AddHabitModal.jsx";
import MonthBanner from "../../components/MonthBanner.jsx";
import { isScheduledToday, quoteOfTheDay } from "../../utils/helpers.js";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ProgressRing = ({ percent, size = 92, stroke = 9, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-ink-900/8 dark:text-white/10" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} stroke="#6C63F2" strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (percent / 100) * c }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-4 sm:p-5 min-w-0">
    <div className="flex items-center justify-between gap-2 mb-3">
      <span className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 min-w-0">{label}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1a` }}>
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs text-ink-900/45 dark:text-ink-50/45 mt-1">{sub}</p>}
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const { habits, overview, loading } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);

  const todaysHabits = useMemo(() => habits.filter((h) => isScheduledToday(h)), [habits]);
  const quote = useMemo(() => quoteOfTheDay(), []);

  const todayPercent = overview && overview.todayTotal
    ? Math.round((overview.todayCompleted / overview.todayTotal) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-6">
      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-soft"
        >
          <Plus size={16} /> Add habit
        </button>
      </div>

      <MonthBanner />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-4 sm:p-5 flex items-center gap-4 col-span-2 sm:col-span-1 min-w-0">
          <div className="relative shrink-0">
            <ProgressRing percent={todayPercent} />
            <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-sm">
              {todayPercent}%
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 truncate">Today's progress</p>
            <p className="font-display text-lg font-bold truncate">{overview?.todayCompleted || 0}/{overview?.todayTotal || 0}</p>
            <p className="text-xs text-ink-900/45 dark:text-ink-50/45 truncate">habits done</p>
          </div>
        </div>
        <StatCard icon={Flame} label="Best streak" value={overview?.bestStreak || 0} sub="days in a row" accent="#F59E0B" />
        <StatCard icon={TrendingUp} label="Monthly progress" value={`${overview?.monthlyProgress || 0}%`} sub="of this month completed" accent="#06B6D4" />
        <StatCard icon={Target} label="Total habits" value={overview?.totalHabits || 0} sub="being tracked" accent="#8B5CF6" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's habits */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Today's habits</h2>
            <Link to="/app/matrix" className="text-xs font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1">
              Monthly grid <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading...</p>
          ) : todaysHabits.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-ink-900/50 dark:text-ink-50/50 mb-3">No habits scheduled today yet.</p>
              <button onClick={() => setModalOpen(true)} className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                Add your first habit →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysHabits.map((h) => {
                const s = overview?.streaks?.find((x) => x.habitId === h._id);
                return <HabitCard key={h._id} habit={h} streak={s?.current || 0} />;
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Motivational quote */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white p-5 shadow-soft">
            <Quote size={20} className="text-white/60 mb-2" />
            <p className="text-sm leading-relaxed font-medium">{quote}</p>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5 space-y-3">
            <Link to="/app/goals" className="flex items-center justify-between text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300">
              <span className="flex items-center gap-2"><Target size={16} /> View your goals</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/app/reminders" className="flex items-center justify-between text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300">
              <span className="flex items-center gap-2"><BellRing size={16} /> Manage reminders</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/app/journal" className="flex items-center justify-between text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300">
              <span className="flex items-center gap-2"><Quote size={16} /> Write in your journal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
