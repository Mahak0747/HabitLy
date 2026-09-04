import express from "express";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, sendError } from "../utils/apiHelpers.js";

// Standalone Task Manager routes. Deliberately independent of the Habit
// system: no Habit import, no month/year scoping, no interaction with
// streaks or analytics. Every route is scoped to req.user._id from the
// verified JWT, same as every other resource in the app.
const router = express.Router();
router.use(protect);

const MAX_TITLE_LENGTH = 200;

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required" });
    const trimmed = title.trim();
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ message: `Task title is too long (${MAX_TITLE_LENGTH} characters max)` });
    }
    const task = await Task.create({ user: req.user._id, title: trimmed });
    res.status(201).json(task);
  } catch (err) {
    sendError(res, err);
  }
});

// Update a task's title and/or completed state.
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.body.title !== undefined) {
      const trimmed = req.body.title.trim();
      if (!trimmed) return res.status(400).json({ message: "Task title is required" });
      if (trimmed.length > MAX_TITLE_LENGTH) {
        return res.status(400).json({ message: `Task title is too long (${MAX_TITLE_LENGTH} characters max)` });
      }
      task.title = trimmed;
    }
    if (req.body.completed !== undefined) {
      task.completed = Boolean(req.body.completed);
    }

    await task.save();
    res.json(task);
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task id" });
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
