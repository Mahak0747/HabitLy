import express from "express";
import Habit from "../models/Habit.js";
import { protect } from "../middleware/auth.js";
import { sendError } from "../utils/apiHelpers.js";

const router = express.Router();
router.use(protect);

// Build calendar-date strings from local getFullYear()/getMonth()/getDate(),
// never from toISOString() — that converts to UTC first and can shift the
// calendar day by a full day depending on the server's timezone offset.
const pad2 = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Whether a habit is "scheduled" for a given JS Date based on its frequency
const isScheduled = (habit, date) => {
  const day = date.getDay();
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekly") return day === 1; // default weekly = Monday
  if (habit.frequency === "custom") return habit.customDays.includes(day);
  return true;
};

const resolveMonthYear = (query) => {
  const now = new Date();
  let month = parseInt(query.month, 10);
  let year = parseInt(query.year, 10);
  if (!month || month < 1 || month > 12) month = now.getMonth() + 1;
  if (!year || Number.isNaN(year) || year < 1970 || year > 3000) year = now.getFullYear();
  return { month, year };
};

// Habits belong to a single month, so every calculation below is bounded to
// that month's own days — no walking backwards across month boundaries into
// a different habit document's data.
//
// `referenceDay` is the last day within the month that "counts" right now:
// every day of the month for a past month, today's day-of-month for the
// current month, and 0 (nothing counts yet) for a future month.
const calcStreak = (habit, year, month, daysInMonth, referenceDay) => {
  const completedDates = new Set(habit.completions.filter((c) => c.completed).map((c) => c.date));
  const dateStrFor = (day) => `${year}-${pad2(month)}-${pad2(day)}`;

  // Current streak: walk backward from referenceDay to day 1, stopping at
  // the first scheduled-but-incomplete day (today not yet done doesn't
  // break the streak).
  let current = 0;
  for (let day = referenceDay; day >= 1; day--) {
    const d = new Date(year, month - 1, day);
    if (!isScheduled(habit, d)) continue;
    if (completedDates.has(dateStrFor(day))) {
      current += 1;
    } else if (day === referenceDay) {
      continue; // today (or the last counted day) not done yet — don't break the streak
    } else {
      break;
    }
  }

  // Longest streak within the month.
  let longest = 0;
  let run = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (!isScheduled(habit, d)) continue;
    if (completedDates.has(dateStrFor(day))) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  return { current, longest: Math.max(longest, current) };
};

// Overview stats for one month — powers the Dashboard, Habit Board header
// stats, and Analytics. Scoped entirely to habits that belong to the
// requested month/year, so switching months always shows that month's own
// numbers, never data mixed in from another month.
router.get("/overview", async (req, res) => {
  try {
    const { month, year } = resolveMonthYear(req.query);
    const habits = await Habit.find({ user: req.user._id, month, year });

    const now = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const isFutureMonth =
      year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    const referenceDay = isFutureMonth ? 0 : isCurrentMonth ? now.getDate() : daysInMonth;

    const todayStr = toDateStr(now);
    const scheduledToday = isCurrentMonth ? habits.filter((h) => isScheduled(h, now)) : [];
    const completedToday = scheduledToday.filter((h) =>
      h.completions.some((c) => c.date === todayStr && c.completed)
    );

    // monthly progress: percentage of scheduled-habit-days completed so far this month
    let scheduledCount = 0;
    let doneCount = 0;
    for (let day = 1; day <= referenceDay; day++) {
      const d = new Date(year, month - 1, day);
      const dstr = toDateStr(d);
      habits.forEach((h) => {
        if (isScheduled(h, d)) {
          scheduledCount += 1;
          if (h.completions.some((c) => c.date === dstr && c.completed)) doneCount += 1;
        }
      });
    }
    const monthlyProgress = scheduledCount ? Math.round((doneCount / scheduledCount) * 100) : 0;

    const streaks = habits.map((h) => ({
      habitId: h._id,
      name: h.name,
      ...calcStreak(h, year, month, daysInMonth, referenceDay),
    }));
    const bestStreak = streaks.reduce((max, s) => Math.max(max, s.longest), 0);
    const overallCurrentStreak = streaks.reduce((max, s) => Math.max(max, s.current), 0);

    // Daily completion rate across every day of the selected month (used
    // for the Analytics trend chart). Days after referenceDay haven't
    // happened yet and are flagged as `future` rather than counted.
    const dailyTrend = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dstr = toDateStr(d);
      let scheduled = 0;
      let done = 0;
      habits.forEach((h) => {
        if (isScheduled(h, d)) {
          scheduled += 1;
          if (h.completions.some((c) => c.date === dstr && c.completed)) done += 1;
        }
      });
      dailyTrend.push({
        date: dstr,
        day,
        percent: scheduled ? Math.round((done / scheduled) * 100) : 0,
        future: day > referenceDay,
      });
    }

    res.json({
      year,
      month,
      daysInMonth,
      totalHabits: habits.length,
      todayTotal: scheduledToday.length,
      todayCompleted: completedToday.length,
      monthlyProgress,
      bestStreak,
      overallCurrentStreak,
      streaks,
      dailyTrend,
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Data for the monthly matrix grid — habits + per-day scheduled/completed
// state for one month. Only habits that belong to that month are included.
router.get("/monthly", async (req, res) => {
  try {
    const { month, year } = resolveMonthYear(req.query);
    const habits = await Habit.find({ user: req.user._id, month, year }).sort({ order: 1, createdAt: 1 });
    const daysInMonth = new Date(year, month, 0).getDate();

    const matrix = habits.map((h) => {
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        const dstr = toDateStr(d);
        days.push({
          date: dstr,
          day,
          scheduled: isScheduled(h, d),
          completed: h.completions.some((c) => c.date === dstr && c.completed),
        });
      }
      return { habitId: h._id, name: h.name, color: h.color, icon: h.icon, days };
    });

    res.json({ year, month, daysInMonth, matrix });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
