import React from "react";
import { CalendarClock, ArrowRight } from "lucide-react";
import { useHabits } from "../context/HabitContext.jsx";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Since every screen (Dashboard, Monthly Matrix, Analytics) is scoped to the
// same "active month" as the Monthly Matrix, this small banner makes it
// obvious when you're looking at a month other than the real current one,
// with a one-tap way back.
const MonthBanner = () => {
  const { activeMonth, activeYear, isRealCurrentMonth, goToCurrentMonth } = useHabits();

  if (isRealCurrentMonth) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-500/8 border border-brand-500/20 px-4 py-3 flex-wrap sm:flex-nowrap">
      <CalendarClock size={16} className="text-brand-600 dark:text-brand-300 shrink-0" />
      <p className="text-xs sm:text-sm font-medium text-brand-800 dark:text-brand-200 flex-1 min-w-0">
        Viewing <span className="font-semibold">{monthNames[activeMonth - 1]} {activeYear}</span> — habits and stats here belong only to this month.
      </p>
      <button
        onClick={goToCurrentMonth}
        className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-200 hover:underline shrink-0"
      >
        Back to this month <ArrowRight size={12} />
      </button>
    </div>
  );
};

export default MonthBanner;
