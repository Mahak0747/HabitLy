import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "time must be in HH:MM (24h) format"],
    },
    days: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: (arr) => arr.length > 0 && arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: "days must be a non-empty array of integers 0-6",
      },
    },
    habit: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
