import React, { useMemo } from "react";
import { Award, Flame, Target, CalendarCheck, Sparkles, Trophy, Lock } from "lucide-react";
import { useHabits } from "../../context/HabitContext.jsx";

const Achievements = () => {
  const { overview, habits, loading } = useHabits();

  const badges = useMemo(() => {
    if (!overview) return [];
    const totalCompletions = habits.reduce((sum, h) => sum + (h.completions?.length || 0), 0);
    return [
      { id: "first", title: "First step", desc: "Complete your first habit", icon: Sparkles, unlocked: totalCompletions >= 1 },
      { id: "three-habits", title: "Getting organized", desc: "Track 3 or more habits at once", icon: Target, unlocked: overview.totalHabits >= 3 },
      { id: "streak-3", title: "On a roll", desc: "Reach a 3-day streak", icon: Flame, unlocked: overview.bestStreak >= 3 },
      { id: "streak-7", title: "One week strong", desc: "Reach a 7-day streak", icon: Flame, unlocked: overview.bestStreak >= 7 },
      { id: "streak-30", title: "Habit master", desc: "Reach a 30-day streak", icon: Trophy, unlocked: overview.bestStreak >= 30 },
      { id: "month-half", title: "Halfway there", desc: "Hit 50% monthly completion", icon: CalendarCheck, unlocked: overview.monthlyProgress >= 50 },
      { id: "month-full", title: "Perfect month", desc: "Hit 90%+ monthly completion", icon: Award, unlocked: overview.monthlyProgress >= 90 },
      { id: "fifty", title: "Half century", desc: "Log 50 total completions", icon: Trophy, unlocked: totalCompletions >= 50 },
    ];
  }, [overview, habits]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">
          {loading ? "Loading..." : `${unlockedCount} of ${badges.length} unlocked`}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`rounded-2xl border p-5 text-center shadow-card transition-colors ${
              b.unlocked
                ? "bg-white dark:bg-ink-900 border-brand-500/20"
                : "bg-ink-900/[0.02] dark:bg-white/[0.02] border-ink-900/5 dark:border-white/5"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                b.unlocked ? "bg-gradient-to-br from-brand-500 to-brand-700" : "bg-ink-900/8 dark:bg-white/8"
              }`}
            >
              {b.unlocked ? <b.icon size={24} className="text-white" /> : <Lock size={20} className="text-ink-900/25 dark:text-ink-50/25" />}
            </div>
            <h3 className={`font-display font-semibold text-sm mb-1 ${!b.unlocked && "text-ink-900/40 dark:text-ink-50/40"}`}>{b.title}</h3>
            <p className="text-xs text-ink-900/45 dark:text-ink-50/45">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
