import express from "express";
import Goal from "../models/Goal.js";
import Habit from "../models/Habit.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, sendError } from "../utils/apiHelpers.js";

const router = express.Router();
router.use(protect);

// If a `habit` id is provided, make sure it's a real habit that belongs to
// the requesting user — otherwise a goal could be created pointing at
// another user's habit (or at nothing at all). Returns `undefined` when no
// habit was provided (valid — a goal doesn't need to be tied to a habit),
// or throws a { status, message } style object the caller turns into a
// response.
const resolveOwnedHabit = async (habitId, userId) => {
  if (habitId === undefined || habitId === null || habitId === "") return null;
  if (!isValidObjectId(habitId)) {
    const err = new Error("Invalid habit reference");
    err.status = 400;
    throw err;
  }
  const habit = await Habit.findOne({ _id: habitId, user: userId });
  if (!habit) {
    const err = new Error("Referenced habit was not found or does not belong to you");
    err.status = 400;
    throw err;
  }
  return habit._id;
};

router.get("/", async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, target, unit, deadline, habit } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
    const numericTarget = Number(target);
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      return res.status(400).json({ message: "Target must be a positive number" });
    }

    let habitId;
    try {
      habitId = await resolveOwnedHabit(habit, req.user._id);
    } catch (e) {
      return res.status(e.status || 400).json({ message: e.message });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title: title.trim(),
      description,
      target: numericTarget,
      unit,
      deadline,
      habit: habitId,
    });
    res.status(201).json(goal);
  } catch (err) {
    sendError(res, err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid goal id" });

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (req.body.habit !== undefined) {
      try {
        goal.habit = await resolveOwnedHabit(req.body.habit, req.user._id);
      } catch (e) {
        return res.status(e.status || 400).json({ message: e.message });
      }
    }

    if (req.body.target !== undefined) {
      const numericTarget = Number(req.body.target);
      if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
        return res.status(400).json({ message: "Target must be a positive number" });
      }
      goal.target = numericTarget;
    }

    if (req.body.progress !== undefined) {
      const numericProgress = Number(req.body.progress);
      if (!Number.isFinite(numericProgress)) {
        return res.status(400).json({ message: "Progress must be a number" });
      }
      // Defense in depth: clamp server-side too, don't rely only on the
      // frontend to keep progress within [0, target].
      goal.progress = Math.max(0, Math.min(numericProgress, goal.target));
    }

    const fields = ["title", "description", "unit", "deadline", "completed"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) goal[f] = req.body[f];
    });
    if (req.body.title !== undefined && !goal.title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (goal.progress >= goal.target) goal.completed = true;
    await goal.save();
    res.json(goal);
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid goal id" });
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
