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
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Task", taskSchema);
