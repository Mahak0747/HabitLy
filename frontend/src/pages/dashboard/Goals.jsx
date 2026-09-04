import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, X, Minus, CheckCircle2 } from "lucide-react";
import api from "../../api/axios.js";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", target: 10, unit: "times" });

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/goals");
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addGoal = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { data } = await api.post("/goals", form);
    setGoals((g) => [data, ...g]);
    setForm({ title: "", target: 10, unit: "times" });
    setFormOpen(false);
  };

  const bump = async (goal, delta) => {
    const progress = Math.max(0, Math.min(goal.target, goal.progress + delta));
    const { data } = await api.put(`/goals/${goal._id}`, { progress });
    setGoals((g) => g.map((x) => (x._id === goal._id ? data : x)));
  };

  const remove = async (id) => {
    await api.delete(`/goals/${id}`);
    setGoals((g) => g.filter((x) => x._id !== id));
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">Bigger targets your habits are building toward.</p>
        </div>
        <button
          onClick={() => setFormOpen((s) => !s)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-soft"
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />} {formOpen ? "Close" : "New goal"}
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addGoal}
            className="overflow-hidden rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card"
          >
            <div className="p-5 grid sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Goal title, e.g. Read 12 books"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="sm:col-span-2 px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <input
                placeholder="unit (books, times, km...)"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 sm:col-span-2"
              />
              <button type="submit" className="px-4 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">
                Create goal
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading goals...</p>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-10 text-center">
          <Target size={28} className="mx-auto text-brand-500/50 mb-3" />
          <p className="text-sm text-ink-900/50 dark:text-ink-50/50">No goals yet. Add one to give your habits a bigger target.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.progress / g.target) * 100));
            return (
              <div key={g._id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {g.completed ? <CheckCircle2 size={17} className="text-emerald-500 shrink-0" /> : <Target size={17} className="text-brand-500 shrink-0" />}
                    <h3 className="font-display font-semibold text-sm truncate" title={g.title}>{g.title}</h3>
                  </div>
                  <button onClick={() => remove(g._id)} className="text-ink-900/25 dark:text-ink-50/25 hover:text-red-500 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="h-2 rounded-full bg-ink-900/8 dark:bg-white/10 overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-brand-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-900/50 dark:text-ink-50/50 truncate min-w-0">{g.progress} / {g.target} {g.unit}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => bump(g, -1)} className="w-7 h-7 rounded-full bg-ink-900/5 dark:bg-white/10 flex items-center justify-center">
                      <Minus size={13} />
                    </button>
                    <button onClick={() => bump(g, 1)} className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
