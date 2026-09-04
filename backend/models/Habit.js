import mongoose from "mongoose";

const completionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    completed: { type: Boolean, default: true },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    icon: { type: String, default: "sparkles" },
    color: { type: String, default: "#6366F1" },
    // A habit document belongs to exactly one calendar month for one user.
    // Adding "Meditation" in September and "Meditation" in October creates
    // two independent documents with independent completions — nothing is
    // copied or shared between months.
    month: { type: Number, required: true, min: 1, max: 12 }, // 1-12
    year: { type: Number, required: true, min: 1970, max: 3000 },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "custom"],
      default: "daily",
    },
    customDays: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: "customDays must only contain integers 0-6 (Sun-Sat)",
      },
    },
    status: {
      type: String,
      enum: ["done", "working", "not-started"],
      default: "not-started",
    },
    reminderTime: { type: String, default: null }, // "HH:MM"
    // Manual sort position within the habit's own month, used by the
    // Monthly Matrix's drag-and-drop reordering. Lower = earlier. Scoped
    // implicitly by month/year since a habit document only ever belongs to
    // one month, so reordering can never leak across months.
    order: { type: Number, default: 0 },
    completions: { type: [completionSchema], default: [] },
  },
  { timestamps: true }
);

// Fast lookups of "all habits for this user in this month/year", in display order.
habitSchema.index({ user: 1, year: 1, month: 1, order: 1 });

// Prevent duplicate habit names within the same user + month + year. There
// is no archived/soft-delete flag in this system — a deleted habit is
// permanently removed from MongoDB, so its name is immediately free to
// reuse in that same month, and always free to use in a different month.
habitSchema.index({ user: 1, year: 1, month: 1, name: 1 }, { unique: true });

export default mongoose.model("Habit", habitSchema);
