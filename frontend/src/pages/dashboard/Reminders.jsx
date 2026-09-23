import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Check, Pencil,
  GripVertical, CalendarDays, AlertCircle,
} from "lucide-react";
import api from "../../api/axios.js";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { toLocalDateStr, todayStr } from "../../utils/helpers.js";

// Calendar + date-based To-Do list. This replaced the old time/day-of-week
// Reminder UI. It is a fully standalone feature:
// - Talks only to the new /api/calendar-tasks endpoints, backed by the new
//   isolated CalendarTask collection (backend/models/CalendarTask.js).
// - Never reads or writes the original Reminder collection — any reminders
//   a user already created still exist untouched in the database, simply
//   no longer surfaced by this page.
// - Every request goes through the same authenticated `api` axios
//   instance (JWT from localStorage) used everywhere else in the app, and
//   every backend route re-checks req.user._id, so a user can only ever
//   see/change their own tasks.

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Reminders = () => {
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState(now.getMonth() + 1); // 1-12
  const [activeYear, setActiveYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState({}); // { "YYYY-MM-DD": { total, completed } }
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null); // "YYYY-MM-DD" | null

  const today = todayStr();

  const loadSummary = async (month, year) => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const { data } = await api.get("/calendar-tasks/summary", { params: { month, year } });
      setSummary(data);
    } catch (err) {
      setSummaryError(err.response?.data?.message || "Couldn't load your calendar. Try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(activeMonth, activeYear);
  }, [activeMonth, activeYear]);

  const changeMonth = (delta) => {
    let m = activeMonth + delta;
    let y = activeYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setActiveMonth(m);
    setActiveYear(y);
  };

  // Build the calendar grid: leading blanks so day 1 lands on its real
  // weekday, then one cell per day of the month. Built from local Date
  // components (never toISOString/UTC) so "today" always matches the
  // user's actual local calendar date.
  const cells = useMemo(() => {
    const firstWeekday = new Date(activeYear, activeMonth - 1, 1).getDay();
    const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();
    const out = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      out.push(toLocalDateStr(new Date(activeYear, activeMonth - 1, day)));
    }
    return out;
  }, [activeMonth, activeYear]);

  // Called by the modal whenever that date's task list changes, so the
  // calendar's dot/count updates immediately without a full month refetch.
  const applyDaySummary = (date, tasks) => {
    setSummary((prev) => {
      const next = { ...prev };
      if (!tasks.length) {
        delete next[date];
      } else {
        next[date] = { total: tasks.length, completed: tasks.filter((t) => t.completed).length };
      }
      return next;
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">
            Pick a date, keep a to-do list for it.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-ink-900 border border-ink-900/8 dark:border-white/8 rounded-full p-1 shrink-0">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-ink-900/5 dark:hover:bg-white/10" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold px-1 sm:px-2 min-w-[104px] sm:min-w-[130px] text-center">
            {monthNames[activeMonth - 1]} {activeYear}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-ink-900/5 dark:hover:bg-white/10" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card overflow-hidden">
        {summaryError ? (
          <div className="p-10 text-center">
            <AlertCircle size={26} className="mx-auto text-red-500/70 mb-3" />
            <p className="text-sm text-red-500 mb-3">{summaryError}</p>
            <button
              onClick={() => loadSummary(activeMonth, activeYear)}
              className="text-sm font-semibold text-brand-600 dark:text-brand-300"
            >
              Try again →
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5">
              {dayHeaders.map((d) => (
                <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-ink-900/40 dark:text-ink-50/40 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {summaryLoading
                ? Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-ink-900/5 dark:bg-white/5 animate-pulse" />
                  ))
                : cells.map((date, i) => {
                    if (!date) return <div key={`blank-${i}`} />;
                    const day = Number(date.slice(8, 10));
                    const info = summary[date];
                    const isToday = date === today;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border text-sm font-semibold transition-colors ${
                          isToday
                            ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                            : "border-transparent hover:bg-ink-900/5 dark:hover:bg-white/5 text-ink-900/80 dark:text-ink-50/80"
                        }`}
                      >
                        <span>{day}</span>
                        {info && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              info.completed === info.total ? "bg-green-500" : "bg-brand-500"
                            }`}
                            title={`${info.completed}/${info.total} done`}
                          />
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>
        )}
      </div>

      <DayTasksModal
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onTasksChanged={applyDaySummary}
      />
    </div>
  );
};

// --- Day panel: opened as a modal when a calendar date is clicked. Owns
// its own fetch/CRUD/reorder state for that single date's task list. ---
const DayTasksModal = ({ date, onClose, onTasksChanged }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  useEffect(() => {
    if (!date) return;
    setTasks([]);
    setTitle("");
    setAddError("");
    setEditingId(null);
    setLoadError("");
    setLoading(true);
    api
      .get("/calendar-tasks", { params: { date } })
      .then(({ data }) => setTasks(data))
      .catch((err) => setLoadError(err.response?.data?.message || "Couldn't load tasks for this date."))
      .finally(() => setLoading(false));
  }, [date]);

  const sync = (next) => {
    setTasks(next);
    onTasksChanged(date, next);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setAddError("");
    try {
      const { data } = await api.post("/calendar-tasks", { date, title: title.trim() });
      sync([...tasks, data]);
      setTitle("");
    } catch (err) {
      setAddError(err.response?.data?.message || "Couldn't add that task. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    const nextCompleted = !task.completed;
    const optimistic = tasks.map((t) => (t._id === task._id ? { ...t, completed: nextCompleted } : t));
    sync(optimistic);
    try {
      const { data } = await api.put(`/calendar-tasks/${task._id}`, { completed: nextCompleted });
      sync(tasks.map((t) => (t._id === task._id ? data : t)));
    } catch {
      sync(tasks); // roll back to pre-optimistic state
    }
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditError("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditError("Task title is required");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const { data } = await api.put(`/calendar-tasks/${editingId}`, { title: trimmed });
      sync(tasks.map((t) => (t._id === editingId ? data : t)));
      cancelEdit();
    } catch (err) {
      setEditError(err.response?.data?.message || "Couldn't save that edit. Try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    const previous = tasks;
    sync(tasks.filter((t) => t._id !== id));
    setPendingDelete(null);
    try {
      await api.delete(`/calendar-tasks/${id}`);
    } catch {
      sync(previous); // roll back
    }
  };

  const ids = useMemo(() => tasks.map((t) => t._id), [tasks]);

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrderIds = arrayMove(ids, oldIndex, newIndex);
    const previous = tasks;
    const byId = new Map(tasks.map((t) => [t._id, t]));
    sync(newOrderIds.map((id) => byId.get(id)));
    try {
      const { data } = await api.patch("/calendar-tasks/reorder", { date, order: newOrderIds });
      sync(data);
    } catch {
      sync(previous); // roll back
    }
  };

  const open = Boolean(date);
  const heading = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-white dark:bg-ink-900 rounded-t-2xl sm:rounded-2xl border border-ink-900/5 dark:border-white/5 shadow-card overflow-hidden"
          >
            <ConfirmModal
              open={!!pendingDelete}
              title="Delete this task?"
              message={pendingDelete ? `"${pendingDelete.title}" will be permanently deleted. This can't be undone.` : ""}
              confirmLabel="Delete task"
              onConfirm={confirmDelete}
              onCancel={() => setPendingDelete(null)}
            />

            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-ink-900/8 dark:border-white/8 shrink-0">
              <div className="min-w-0 flex items-center gap-2">
                <CalendarDays size={17} className="text-brand-500 shrink-0" />
                <h2 className="font-display font-bold text-base truncate">{heading}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-ink-900/40 dark:text-ink-50/40 hover:bg-ink-900/5 dark:hover:bg-white/5 shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 shrink-0 border-b border-ink-900/8 dark:border-white/8">
              {addError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 rounded-lg px-3 py-2.5">
                  {addError}
                </div>
              )}
              <form onSubmit={addTask} className="flex gap-2">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); if (addError) setAddError(""); }}
                  placeholder="Add a task for this date..."
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 shrink-0"
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto thin-scroll p-4 sm:p-5">
              {loading ? (
                <p className="text-sm text-ink-900/40 dark:text-ink-50/40 text-center py-6">Loading tasks...</p>
              ) : loadError ? (
                <div className="text-center py-6">
                  <AlertCircle size={22} className="mx-auto text-red-500/70 mb-2" />
                  <p className="text-sm text-red-500">{loadError}</p>
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-ink-900/45 dark:text-ink-50/45 text-center py-6">
                  No tasks for this date yet — add one above.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {tasks.map((t) => (
                        <SortableDayTaskRow
                          key={t._id}
                          task={t}
                          onToggle={toggleTask}
                          onDelete={setPendingDelete}
                          editing={editingId === t._id}
                          editTitle={editTitle}
                          editError={editError}
                          editSaving={editSaving}
                          onStartEdit={startEdit}
                          onEditTitleChange={setEditTitle}
                          onSaveEdit={saveEdit}
                          onCancelEdit={cancelEdit}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SortableDayTaskRow = ({
  task, onToggle, onDelete,
  editing, editTitle, editError, editSaving, onStartEdit, onEditTitleChange, onSaveEdit, onCancelEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : "auto",
  };

  if (editing) {
    return (
      <form
        ref={setNodeRef}
        style={style}
        onSubmit={onSaveEdit}
        className="flex items-center gap-2 p-3 rounded-xl border border-brand-500/40 bg-white dark:bg-ink-900 shadow-soft"
      >
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        {editError && <span className="text-xs text-red-500 shrink-0">{editError}</span>}
        <button
          type="submit"
          disabled={editSaving || !editTitle.trim()}
          className="px-3 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 disabled:opacity-50 shrink-0"
        >
          {editSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="p-2 text-ink-900/40 dark:text-ink-50/40 hover:text-ink-900 dark:hover:text-ink-50 shrink-0"
          aria-label="Cancel edit"
        >
          <X size={16} />
        </button>
      </form>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${isDragging ? "opacity-70" : ""} ${
        task.completed
          ? "bg-brand-500/8 border-brand-500/25"
          : "bg-white dark:bg-ink-900 border-ink-900/8 dark:border-white/8"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${task.title}`}
        className="p-1 text-ink-900/20 dark:text-ink-50/20 hover:text-ink-900/50 dark:hover:text-ink-50/50 cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <GripVertical size={15} />
      </button>
      <button
        onClick={() => onToggle(task)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
          task.completed ? "bg-brand-500 border-brand-500 text-white" : "border-ink-900/15 dark:border-white/20"
        }`}
      >
        {task.completed && <Check size={14} strokeWidth={3} />}
      </button>
      <p className={`text-sm font-semibold flex-1 min-w-0 truncate ${task.completed ? "line-through text-ink-900/50 dark:text-ink-50/50" : ""}`}>
        {task.title}
      </p>
      <button
        onClick={() => onStartEdit(task)}
        aria-label="Edit task"
        className="p-1.5 text-ink-900/25 dark:text-ink-50/25 hover:text-brand-500 transition-colors shrink-0"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => onDelete(task)}
        aria-label="Delete task"
        className="p-1.5 text-ink-900/25 dark:text-ink-50/25 hover:text-red-500 transition-colors shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default Reminders;
