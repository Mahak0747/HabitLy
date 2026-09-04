import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2, Flame } from "lucide-react";
import { useHabits } from "../context/HabitContext.jsx";
import { todayStr, habitCompletedOn } from "../utils/helpers.js";
import ConfirmModal from "./ConfirmModal.jsx";

const HabitCard = ({ habit, streak = 0 }) => {
  const { toggleCompletion, deleteHabit } = useHabits();
  const done = habitCompletedOn(habit, todayStr());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmDelete = async () => {
    await deleteHabit(habit._id);
    setConfirmOpen(false);
  };

  return (
    <motion.div
      layout
      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
        done
          ? "bg-brand-500/8 border-brand-500/25"
          : "bg-white dark:bg-ink-900 border-ink-900/8 dark:border-white/8"
      }`}
    >
      <ConfirmModal
        open={confirmOpen}
        title="Delete this habit?"
        message={`"${habit.name}" will be permanently deleted, along with its completion history for this month. This can't be undone.`}
        confirmLabel="Delete habit"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <button
        onClick={() => toggleCompletion(habit._id, todayStr())}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
          done ? "bg-brand-500 border-brand-500 text-white" : "border-ink-900/15 dark:border-white/20"
        }`}
        style={!done ? { borderColor: habit.color } : {}}
      >
        {done && <Check size={17} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${done ? "line-through text-ink-900/50 dark:text-ink-50/50" : ""}`}>
          {habit.name}
        </p>
        <p className="text-xs text-ink-900/45 dark:text-ink-50/45 capitalize">{habit.frequency}</p>
      </div>

      {streak > 0 && (
        <span className="flex items-center gap-1 text-xs font-semibold text-orange-500 shrink-0">
          <Flame size={13} /> {streak}
        </span>
      )}

      <button
        onClick={() => setConfirmOpen(true)}
        aria-label="Delete habit"
        className="p-1.5 text-ink-900/25 dark:text-ink-50/25 hover:text-red-500 transition-colors shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
};

export default HabitCard;
