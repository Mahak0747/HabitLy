import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    target: { type: Number, required: true, default: 1, min: 0.0001 },
    progress: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "times", maxlength: 40 },
    deadline: { type: Date, default: null },
    habit: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
