import React, { useMemo, useState } from "react";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Check, Minus, Plus, Trash2, GripVertical } from "lucide-react";
import { useHabits } from "../../context/HabitContext.jsx";
import AddHabitModal from "../../components/AddHabitModal.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { toLocalDateStr, todayStr, isScheduledOn, habitCompletedOn } from "../../utils/helpers.js";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// One draggable row of the matrix. The drag handle lives in the sticky
// name column so dragging never conflicts with tapping a day cell.
const SortableRow = ({ row, today, hovered, setHovered, onToggle, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.habitId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : "auto",
    position: "relative",
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : ""}>
      <td className={`sticky left-0 z-10 pl-2 pr-3 ${isDragging ? "bg-brand-500/5" : "bg-white dark:bg-ink-900"}`}>
        <div className="flex items-center gap-1.5 py-1 group">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${row.name}`}
            className="p-1 -ml-1 text-ink-900/20 dark:text-ink-50/20 hover:text-ink-900/50 dark:hover:text-ink-50/50 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          >
            <GripVertical size={13} />
          </button>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
          <span className="text-xs font-semibold whitespace-nowrap">{row.name}</span>
          <button
            onClick={() => onDelete(row)}
            aria-label={`Delete ${row.name}`}
            className="ml-1 p-1 rounded-md text-ink-900/20 dark:text-ink-50/20 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
      {row.days.map((d) => {
        const isHovered = hovered?.habitId === row.habitId && hovered?.date === d.date;
        return (
          <td key={d.date} className="p-0 text-center">
            <button
              onClick={() => onToggle(row.habitId, d.date, d.scheduled)}
              onMouseEnter={() => setHovered({ habitId: row.habitId, date: d.date })}
              onMouseLeave={() => setHovered(null)}
              disabled={!d.scheduled}
              title={`${row.name} · ${d.date} · ${d.scheduled ? (d.completed ? "Completed" : "Not done") : "Not scheduled"}`}
              className={`w-6 h-6 rounded-[6px] flex items-center justify-center transition-transform ${
                d.scheduled ? "cursor-pointer hover:scale-110" : "cursor-default opacity-30"
              } ${d.date === today ? "ring-1 ring-brand-500/50" : ""}`}
              style={{
                backgroundColor: !d.scheduled
                  ? "transparent"
                  : d.completed
                  ? row.color
                  : "rgba(120,113,198,0.12)",
                outline: isHovered ? `2px solid ${row.color}` : "none",
                outlineOffset: 1,
              }}
            >
              {d.scheduled && d.completed && <Check size={12} className="text-white" strokeWidth={3} />}
              {!d.scheduled && <Minus size={10} className="text-ink-900/20 dark:text-ink-50/20" />}
            </button>
          </td>
        );
      })}
    </tr>
  );
};

const MonthlyMatrix = () => {
  // Read straight from HabitContext — the same `habits` array (and the same
  // toggleCompletion / activeMonth / activeYear) that the Dashboard uses.
  // There is no separate fetch or separate copy of completion data here,
  // and month navigation here moves the *whole app's* active month, so a
  // change made anywhere else in the app shows up here immediately, and
  // vice versa.
  const {
    habits, loading, toggleCompletion, deleteHabit, reorderHabits,
    activeMonth, activeYear, setActiveMonth,
  } = useHabits();

  const [hovered, setHovered] = useState(null); // {habitId, date}
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // habit being confirmed for deletion

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  const changeMonth = (delta) => {
    let m = activeMonth + delta;
    let y = activeYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setActiveMonth(m, y);
  };

  // Days in the selected month, built from local Date components (never
  // toISOString/UTC), so "today" always lands on the user's actual local
  // calendar date instead of drifting a day forward or back.
  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();

  // `habits` already comes back from the API sorted by its persisted
  // `order` field, so the matrix's row order is always the up-to-date,
  // saved order for this month — including right after a refresh.
  const matrix = useMemo(() => {
    return habits.map((h) => {
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(activeYear, activeMonth - 1, day);
        const dateStr = toLocalDateStr(d);
        days.push({
          date: dateStr,
          day,
          scheduled: isScheduledOn(h, d),
          completed: habitCompletedOn(h, dateStr),
        });
      }
      return { habitId: h._id, name: h.name, color: h.color, icon: h.icon, days };
    });
  }, [habits, activeMonth, activeYear, daysInMonth]);

  const rowIds = useMemo(() => matrix.map((r) => r.habitId), [matrix]);

  const onToggle = (habitId, date, scheduled) => {
    if (!scheduled) return;
    toggleCompletion(habitId, date);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rowIds.indexOf(active.id);
    const newIndex = rowIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(rowIds, oldIndex, newIndex);
    reorderHabits(newOrder);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteHabit(pendingDelete.habitId);
    setPendingDelete(null);
  };

  const today = todayStr();
  const now = new Date();
  const isCurrentMonth = activeYear === now.getFullYear() && activeMonth === now.getMonth() + 1;

  return (
    <div className="space-y-5 pb-6">
      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this habit?"
        message={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted, along with its completion history for ${monthNames[activeMonth - 1]} ${activeYear}. This can't be undone.` : ""}
        confirmLabel="Delete habit"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Monthly Matrix</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">Every habit, every day — tap a cell to toggle it, drag the handle to reorder.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white dark:bg-ink-900 border border-ink-900/8 dark:border-white/8 rounded-full p-1">
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
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-soft shrink-0"
          >
            <Plus size={16} /> Habit
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-ink-900/40 dark:text-ink-50/40">Loading matrix...</div>
        ) : !matrix.length ? (
          <div className="p-10 text-center">
            <p className="text-sm text-ink-900/50 dark:text-ink-50/50 mb-3">
              0 habits for {monthNames[activeMonth - 1]} {activeYear} — add one to see your monthly grid fill in.
            </p>
            <button onClick={() => setModalOpen(true)} className="text-sm font-semibold text-brand-600 dark:text-brand-300">
              Add your first habit →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="border-separate" style={{ borderSpacing: "6px" }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-ink-900 text-left text-xs font-semibold text-ink-900/50 dark:text-ink-50/50 pl-2 pr-3 pb-1" style={{ minWidth: 168 }}>
                    Habit
                  </th>
                  {matrix[0].days.map((d) => (
                    <th key={d.date} className="text-[10px] font-semibold text-ink-900/40 dark:text-ink-50/40 pb-1" style={{ minWidth: 26 }}>
                      <div className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full ${d.date === today ? "bg-brand-500 text-white" : ""}`}>
                        {d.day}
                      </div>
                      {d.date === today && (
                        <div className="text-[8px] font-bold text-brand-600 dark:text-brand-300 mt-0.5 tracking-wide">TODAY</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {matrix.map((row) => (
                      <SortableRow
                        key={row.habitId}
                        row={row}
                        today={today}
                        hovered={hovered}
                        setHovered={setHovered}
                        onToggle={onToggle}
                        onDelete={setPendingDelete}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 text-xs text-ink-900/50 dark:text-ink-50/50 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[4px] bg-brand-500 inline-block" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[4px] bg-brand-500/10 inline-block" /> Not done</span>
        <span className="flex items-center gap-1.5"><Minus size={12} /> Not scheduled that day</span>
        <span className="flex items-center gap-1.5"><GripVertical size={12} /> Drag to reorder</span>
        {isCurrentMonth && <span className="ml-auto italic">Today is highlighted at the top</span>}
      </div>
    </div>
  );
};

export default MonthlyMatrix;
