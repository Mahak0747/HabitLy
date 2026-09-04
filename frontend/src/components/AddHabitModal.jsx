import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { useHabits } from "../context/HabitContext.jsx";

const colors = ["#6C63F2", "#8B5CF6", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#EF4444"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AddHabitModal = ({ open, onClose }) => {
  const { createHabit, activeMonth, activeYear } = useHabits();
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState([1, 3, 5]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Clear any leftover error each time the modal is (re)opened.
  useEffect(() => {
    if (open) setError("");
  }, [open]);

  const toggleDay = (d) =>
    setCustomDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createHabit({ name: name.trim(), color, frequency, customDays: frequency === "custom" ? customDays : [] });
      setName("");
      setFrequency("daily");
      onClose();
    } catch (err) {
      // Most commonly a 409 duplicate-name-in-this-month conflict.
      setError(err.response?.data?.message || "Something went wrong adding this habit. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-2xl sm:rounded-2xl p-6 shadow-card max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-lg font-bold">New habit</h3>
              <button type="button" onClick={onClose} className="p-1 text-ink-900/40 dark:text-ink-50/40">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-ink-900/45 dark:text-ink-50/45 mb-4">
              This habit will be added to <span className="font-semibold">{monthNames[activeMonth - 1]} {activeYear}</span> only.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 rounded-lg px-3 py-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Habit name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
              placeholder="e.g. Drink 2L of water"
              className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm mb-4"
            />

            <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Color</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 shrink-0"
                  style={{ backgroundColor: c, borderColor: color === c ? "#111" : "transparent" }}
                />
              ))}
            </div>

            <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Frequency</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["daily", "weekly", "custom"].map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold capitalize border transition-colors ${
                    frequency === f
                      ? "bg-brand-500 text-white border-brand-500"
                      : "border-ink-900/10 dark:border-white/15 text-ink-900/60 dark:text-ink-50/60"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {frequency === "custom" && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Repeat on</label>
                <div className="flex gap-1.5 flex-wrap">
                  {dayLabels.map((d, i) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDay(i)}
                      className={`w-9 h-9 rounded-full text-xs font-semibold border ${
                        customDays.includes(i)
                          ? "bg-brand-500 text-white border-brand-500"
                          : "border-ink-900/10 dark:border-white/15 text-ink-900/60 dark:text-ink-50/60"
                      }`}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 mt-2"
            >
              {saving ? "Adding..." : "Add habit"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddHabitModal;
