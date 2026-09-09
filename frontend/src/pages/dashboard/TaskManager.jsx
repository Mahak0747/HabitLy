import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, Trash2, Check, ListChecks, Pencil, GripVertical } from "lucide-react";
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
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

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

  // Edits go through the same PUT /tasks/:id endpoint used for toggling
  // completion — it updates the existing task document in place (never
  // creates a new one) and only touches fields that were actually sent, so
  // completed/order/createdAt are all preserved untouched.
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
      const { data } = await api.put(`/tasks/${editingId}`, { title: trimmed });
      setTasks((prev) => prev.map((t) => (t._id === editingId ? data : t)));
      cancelEdit();
    } catch (err) {
      setEditError(err.response?.data?.message || "Couldn't save that edit. Try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  // Drag-and-drop reordering, kept separate for the Pending and Completed
  // sections so dragging one group never disturbs the other's order.
  // Optimistically reorders local state, persists via PATCH
  // /tasks/reorder (same pattern as the Monthly Matrix's habit reorder),
  // and rolls back if the request fails.
  const reorderSection = async (sectionIds, newSectionOrder) => {
    let previousTasks;
    setTasks((prev) => {
      previousTasks = prev;
      const byId = new Map(prev.map((t) => [t._id, t]));
      const reorderedSection = newSectionOrder.map((id) => byId.get(id)).filter(Boolean);
      let cursor = 0;
      return prev.map((t) => (sectionIds.includes(t._id) ? reorderedSection[cursor++] : t));
    });
    try {
      const { data } = await api.patch("/tasks/reorder", { order: newSectionOrder });
      setTasks(data);
    } catch {
      setTasks(previousTasks); // roll back
    }
  };

  const onDragEndPending = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = pending.map((t) => t._id);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSection(ids, arrayMove(ids, oldIndex, newIndex));
  };

  const onDragEndCompleted = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = completed.map((t) => t._id);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSection(ids, arrayMove(ids, oldIndex, newIndex));
  };

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
              : `${completed.length}/${tasks.length} completed · drag to reorder`}
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndPending}>
                <SortableContext items={pending.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2.5">
                    {pending.map((t) => (
                      <SortableTaskRow
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

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-900/60 dark:text-ink-50/60 mb-3 mt-6">Completed ({completed.length})</h2>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCompleted}>
                <SortableContext items={completed.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2.5">
                    {completed.map((t) => (
                      <SortableTaskRow
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SortableTaskRow = ({
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
        className="flex items-center gap-2 p-3.5 rounded-xl border border-brand-500/40 bg-white dark:bg-ink-900 shadow-soft"
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
      className={`flex items-center gap-2 p-3.5 rounded-xl border transition-colors ${
        isDragging ? "opacity-70" : ""
      } ${
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

export default TaskManager;
