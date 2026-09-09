import mongoose from "mongoose";

// Tasks are a completely independent feature from Habits — separate
// collection, separate model, no reference to Habit anywhere. Nothing here
// is read by, written by, or factored into any habit calculation (streaks,
// monthly completion %, analytics), and nothing in the habit system reads
// from this collection either.
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    // Manual sort position for drag-and-drop reordering in the Task
    // Manager. Lower = earlier. Defaults to 0, so tasks created before this
    // field existed are simply read back as order 0 (Mongoose applies the
    // schema default on hydration even though the field is absent from the
    // stored document) and fall back to the original createdAt-desc order
    // as a tiebreaker below — no migration needed, no existing data touched.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, order: 1, createdAt: -1 });

export default mongoose.model("Task", taskSchema);
