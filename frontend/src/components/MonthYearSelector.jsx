import React, { useMemo } from "react";
import { CalendarDays } from "lucide-react";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// A pair of native <select> dropdowns for jumping straight to any
// month/year. This drives the same shared `activeMonth`/`activeYear` in
// HabitContext that the Monthly Matrix's prev/next arrows already control,
// so choosing a month here keeps Dashboard and Monthly
// Metrics in sync too — there's only ever one "active month" for the app.
const MonthYearSelector = ({ month, year, onChange, className = "" }) => {
  const yearOptions = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const years = new Set([year]);
    for (let y = nowYear - 5; y <= nowYear + 2; y++) years.add(y);
    return Array.from(years).sort((a, b) => a - b);
  }, [year]);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <CalendarDays size={16} className="text-ink-900/40 dark:text-ink-50/40 shrink-0" />
      <select
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
        aria-label="Select month"
        className="px-3 py-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-900/10 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50 max-w-full"
      >
        {monthNames.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
        aria-label="Select year"
        className="px-3 py-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-900/10 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};

export default MonthYearSelector;
