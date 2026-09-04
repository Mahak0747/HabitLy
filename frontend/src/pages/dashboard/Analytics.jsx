import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { useHabits } from "../../context/HabitContext.jsx";
import MonthBanner from "../../components/MonthBanner.jsx";
import MonthYearSelector from "../../components/MonthYearSelector.jsx";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-ink-900 border border-ink-900/10 dark:border-white/10 rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-brand-600 dark:text-brand-300">{payload[0].value}{payload[0].dataKey === "percent" ? "%" : ""}</p>
    </div>
  );
};

const Analytics = () => {
  const { overview, loading, activeMonth, activeYear, setActiveMonth } = useHabits();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">
            {overview ? `Your consistency in ${monthNames[overview.month - 1]} ${overview.year}, distilled to the numbers that matter.` : "Your consistency, distilled to the numbers that matter."}
          </p>
        </div>
        <MonthYearSelector month={activeMonth} year={activeYear} onChange={setActiveMonth} className="shrink-0" />
      </div>

      <MonthBanner />

      {loading || !overview ? (
        <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading analytics...</p>
      ) : (
        <AnalyticsBody overview={overview} />
      )}
    </div>
  );
};

const AnalyticsBody = ({ overview }) => {
  // Bounded to the selected month's own days — never a rolling 30-day
  // window that could cross into a different month's (separate) habits.
  const trend = overview.dailyTrend
    .filter((d) => !d.future)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      percent: d.percent,
    }));

  const streakData = overview.streaks.map((s) => ({ name: s.name, current: s.current, longest: s.longest }));
  const monthLabel = `${monthNames[overview.month - 1]} ${overview.year}`;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
          <p className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 mb-1">Monthly completion</p>
          <p className="font-display text-3xl font-bold">{overview.monthlyProgress}%</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
          <p className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 mb-1">Best current streak</p>
          <p className="font-display text-3xl font-bold">{overview.overallCurrentStreak}<span className="text-sm font-medium text-ink-900/40 dark:text-ink-50/40"> days</span></p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
          <p className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 mb-1">Longest streak this month</p>
          <p className="font-display text-3xl font-bold">{overview.bestStreak}<span className="text-sm font-medium text-ink-900/40 dark:text-ink-50/40"> days</span></p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-4 sm:p-5">
        <h2 className="font-display font-semibold mb-4 text-sm sm:text-base">{monthLabel} — daily completion rate</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-ink-900/40 dark:text-ink-50/40 py-10 text-center">No days have passed in this month yet.</p>
        ) : (
          <div className="h-56 sm:h-64 -ml-2 sm:-ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPercent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63F2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6C63F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,113,198,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(trend.length / 8))} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} width={28} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percent" stroke="#6C63F2" strokeWidth={2} fill="url(#fillPercent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-4 sm:p-5">
        <h2 className="font-display font-semibold mb-4 text-sm sm:text-base">Streaks by habit</h2>
        {streakData.length === 0 ? (
          <p className="text-sm text-ink-900/40 dark:text-ink-50/40 py-10 text-center">No habits for {monthLabel} yet.</p>
        ) : (
          <div className="h-56 sm:h-64 -ml-2 sm:-ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,113,198,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={streakData.length > 5 ? -30 : 0} textAnchor={streakData.length > 5 ? "end" : "middle"} height={streakData.length > 5 ? 46 : 24} />
                <YAxis tick={{ fontSize: 10 }} width={28} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="current" fill="#6C63F2" radius={[6, 6, 0, 0]} />
                <Bar dataKey="longest" fill="#C4BFFA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
};

export default Analytics;
