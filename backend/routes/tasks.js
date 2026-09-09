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

// Sorted by saved drag position first, then by creation date (newest
// first) as a tiebreaker. Tasks created before `order` existed all read
// back as order 0 (see Task.js), so they naturally keep appearing in their
// original newest-first order until the user actually drags something.
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
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

// REORDER tasks — drag-and-drop in the Task Manager. `order` is a list of
// this user's task ids in the desired new sequence (the caller only needs
// to send the ids for the section that was actually reordered, e.g. just
// the pending tasks; any tasks left out keep their existing position).
// Every id must exist and belong to the requesting user — this can never
// touch another user's tasks.
router.patch("/reorder", async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: "order must be a non-empty array of task ids" });
    }
    if (!order.every(isValidObjectId)) {
      return res.status(400).json({ message: "order contains an invalid task id" });
    }
    if (new Set(order).size !== order.length) {
      return res.status(400).json({ message: "order contains duplicate task ids" });
    }

    const tasks = await Task.find({ _id: { $in: order }, user: req.user._id });
    if (tasks.length !== order.length) {
      return res.status(400).json({ message: "One or more tasks were not found or do not belong to you" });
    }

    await Promise.all(
      order.map((id, index) => Task.updateOne({ _id: id, user: req.user._id }, { $set: { order: index } }))
    );

    const updated = await Task.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json(updated);
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
