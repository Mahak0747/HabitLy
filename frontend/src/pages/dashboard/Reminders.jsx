import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, BellRing, Bell, BellOff } from "lucide-react";
import api from "../../api/axios.js";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6] });

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/reminders");
    setReminders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleDay = (d) =>
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { data } = await api.post("/reminders", form);
    setReminders((r) => [...r, data].sort((a, b) => a.time.localeCompare(b.time)));
    setForm({ title: "", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6] });
    setFormOpen(false);
  };

  const toggleActive = async (r) => {
    const { data } = await api.put(`/reminders/${r._id}`, { active: !r.active });
    setReminders((prev) => prev.map((x) => (x._id === r._id ? data : x)));
  };

  const remove = async (id) => {
    await api.delete(`/reminders/${id}`);
    setReminders((prev) => prev.filter((x) => x._id !== id));
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">Set a time, pick the days, don't let it slip.</p>
        </div>
        <button
          onClick={() => setFormOpen((s) => !s)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-soft"
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />} {formOpen ? "Close" : "New reminder"}
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={add}
            className="overflow-hidden rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card"
          >
            <div className="p-5 space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  required
                  placeholder="Reminder title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="sm:col-span-2 px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {dayLabels.map((d, i) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-full text-xs font-semibold border ${
                      form.days.includes(i) ? "bg-brand-500 text-white border-brand-500" : "border-ink-900/10 dark:border-white/15 text-ink-900/60 dark:text-ink-50/60"
                    }`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
              <button type="submit" className="px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">
                Add reminder
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading reminders...</p>
      ) : reminders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-10 text-center">
          <BellRing size={28} className="mx-auto text-brand-500/50 mb-3" />
          <p className="text-sm text-ink-900/50 dark:text-ink-50/50">No reminders set yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => (
            <div key={r._id} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card">
              <button
                onClick={() => toggleActive(r)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${r.active ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "bg-ink-900/5 dark:bg-white/5 text-ink-900/30 dark:text-ink-50/30"}`}
              >
                {r.active ? <Bell size={16} /> : <BellOff size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{r.title}</p>
                <p className="text-xs text-ink-900/45 dark:text-ink-50/45">
                  {r.time} · {r.days.length === 7 ? "Every day" : r.days.map((d) => dayLabels[d]).join(", ")}
                </p>
              </div>
              <button onClick={() => remove(r._id)} className="text-ink-900/25 dark:text-ink-50/25 hover:text-red-500 shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
