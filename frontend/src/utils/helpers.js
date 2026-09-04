// IMPORTANT: always build calendar-date strings (YYYY-MM-DD) from local
// getFullYear()/getMonth()/getDate() — never from toISOString(), which
// converts to UTC first and can shift the calendar day by +/-1 depending
// on the user's timezone (e.g. "tomorrow" showing up as "today").
const pad2 = (n) => String(n).padStart(2, "0");

export const toLocalDateStr = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayStr = () => toLocalDateStr(new Date());

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export const isScheduledToday = (habit, date = new Date()) => {
  const day = date.getDay();
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekly") return day === 1;
  if (habit.frequency === "custom") return (habit.customDays || []).includes(day);
  return true;
};

// Alias — isScheduledToday already accepts an arbitrary date, this name is
// just clearer when checking days other than "today" (e.g. in the matrix).
export const isScheduledOn = isScheduledToday;

export const habitCompletedOn = (habit, dateStr) =>
  habit.completions?.some((c) => c.date === dateStr && c.completed);

export const quotes = [
  "Small habits, repeated daily, build the life you actually want.",
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every action you take is a vote for the type of person you wish to become.",
  "The secret of your future is hidden in your daily routine.",
  "Motivation gets you started. Habit keeps you going.",
  "Success is the product of daily habits, not once-in-a-lifetime transformations.",
  "You do not have to be extreme, just consistent.",
];

export const quoteOfTheDay = () => {
  const idx = new Date().getDate() % quotes.length;
  return quotes[idx];
};
