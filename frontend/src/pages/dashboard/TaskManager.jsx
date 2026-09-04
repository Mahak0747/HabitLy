import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Check, ListChecks } from "lucide-react";
import api from "../../api/axios.js";
import ConfirmModal from "../../components/ConfirmModal.jsx";

// Task Manager is a completely standalone to-do list — its own API
// endpoints (/api/tasks), its own Task model/collection on the backend,
// its own local state here. It never touches HabitContext, never reads or
// writes habit completions, and nothing here feeds into Dashboard stats,
// streaks, or Monthly/Analytics calculations. Habits and Tasks are two
// independent systems that just happen to live in the same app.
const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/tasks", { title: title.trim() });
      setTasks((prev) => [data, ...prev]);
      setTitle("");
      setFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add that task. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, completed: nextCompleted } : t)));
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { completed: nextCompleted });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t))); // roll back
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await api.delete(`/tasks/${pendingDelete._id}`);
    setTasks((prev) => prev.filter((t) => t._id !== pendingDelete._id));
    setPendingDelete(null);
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-5 pb-6">
      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this task?"
        message={pendingDelete ? `"${pendingDelete.title}" will be permanently deleted. This can't be undone.` : ""}
        confirmLabel="Delete task"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Task Manager</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">
            {tasks.length === 0
              ? "A simple to-do list — separate from your habits."
              : `${completed.length}/${tasks.length} completed`}
          </p>
        </div>
        <button
          onClick={() => { setFormOpen((s) => !s); setError(""); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-soft shrink-0"
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />} {formOpen ? "Close" : "New task"}
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addTask}
            className="overflow-hidden rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card"
          >
            <div className="p-5 space-y-3">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
                  placeholder="e.g. Complete assignment"
                  className="flex-1 min-w-[180px] px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="px-4 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 shrink-0"
                >
                  {saving ? "Adding..." : "Add task"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-10 text-center">
          <ListChecks size={28} className="mx-auto text-brand-500/50 mb-3" />
          <p className="text-sm text-ink-900/50 dark:text-ink-50/50 mb-3">No tasks yet — add one to get started.</p>
          <button onClick={() => setFormOpen(true)} className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            Add your first task →
          </button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-semibold text-ink-900/60 dark:text-ink-50/60 mb-3">Pending ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Nothing pending — nice work.</p>
            ) : (
              <div className="space-y-2.5">
                {pending.map((t) => (
                  <TaskRow key={t._id} task={t} onToggle={toggleTask} onDelete={setPendingDelete} />
                ))}
              </div>
            )}
          </div>

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-900/60 dark:text-ink-50/60 mb-3 mt-6">Completed ({completed.length})</h2>
              <div className="space-y-2.5">
                {completed.map((t) => (
                  <TaskRow key={t._id} task={t} onToggle={toggleTask} onDelete={setPendingDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TaskRow = ({ task, onToggle, onDelete }) => (
  <div
    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
      task.completed
        ? "bg-brand-500/8 border-brand-500/25"
        : "bg-white dark:bg-ink-900 border-ink-900/8 dark:border-white/8"
    }`}
  >
    <button
      onClick={() => onToggle(task)}
      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
        task.completed ? "bg-brand-500 border-brand-500 text-white" : "border-ink-900/15 dark:border-white/20"
      }`}
    >
      {task.completed && <Check size={17} strokeWidth={3} />}
    </button>
    <p
      className={`text-sm font-semibold flex-1 min-w-0 truncate ${
        task.completed ? "line-through text-ink-900/50 dark:text-ink-50/50" : ""
      }`}
    >
      {task.title}
    </p>
    <button
      onClick={() => onDelete(task)}
      aria-label="Delete task"
      className="p-1.5 text-ink-900/25 dark:text-ink-50/25 hover:text-red-500 transition-colors shrink-0"
    >
      <Trash2 size={15} />
    </button>
  </div>
);

export default TaskManager;
