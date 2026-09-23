import mongoose from "mongoose";

// Calendar To-Do tasks — powers the new Calendar view that replaced the
// Reminder page's UI. This is a brand-new, fully isolated collection:
// - It does NOT touch, read, write, or reference the existing `Reminder`
//   model/collection in any way. All existing reminder documents are left
//   completely untouched and still live at their own /api/reminders
//   endpoints (routes/reminders.js, unmodified).
// - It does NOT touch the existing standalone `Task` model/collection
//   (Task Manager / /api/tasks) either — different collection name
//   ("calendartasks" vs "tasks"), different schema, no shared code path.
// - Every document is scoped to a single user + a single calendar date, so
//   two different users (or the same user on two different dates) never
//   share task lists.
const calendarTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // YYYY-MM-DD, same local-date-string convention already used by the
    // Journal model (see models/Journal.js + utils/helpers.js toLocalDateStr).
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"],
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    // Manual sort position for drag-and-drop reordering, scoped to this
    // user+date (mirrors the pattern in models/Task.js). Defaults to 0.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Primary access pattern: "give me this user's tasks for this date, in
// order". Also supports the lightweight month-summary query (date range
// scan for a single user) used to show which days have tasks.
calendarTaskSchema.index({ user: 1, date: 1, order: 1, createdAt: 1 });

export default mongoose.model("CalendarTask", calendarTaskSchema);
