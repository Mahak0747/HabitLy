import express from "express";
import CalendarTask from "../models/CalendarTask.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, isValidDateStr, sendError } from "../utils/apiHelpers.js";

// Calendar To-Do routes. Deliberately independent of the existing Reminder
// system (routes/reminders.js + models/Reminder.js are untouched) and of
// the standalone Task Manager (routes/tasks.js + models/Task.js are
// untouched). Every route is scoped to req.user._id from the verified JWT
// (same `protect` middleware every other resource in the app uses), and
// every query additionally filters by that user id, so one user can never
// read, edit, reorder, or delete another user's calendar tasks.
const router = express.Router();
router.use(protect);

const MAX_TITLE_LENGTH = 200;

// GET /api/calendar-tasks?date=YYYY-MM-DD
// Returns this user's tasks for a single date, sorted by saved drag order
// (then creation time as a tiebreaker for tasks that share an order value,
// e.g. before the user has ever dragged anything).
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDateStr(date)) {
      return res.status(400).json({ message: "date query param is required in YYYY-MM-DD format" });
    }
    const tasks = await CalendarTask.find({ user: req.user._id, date }).sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/calendar-tasks/summary?month=1-12&year=YYYY
// Lightweight lookup for the calendar grid: which dates in this month have
// at least one task, and how many are still pending, so the calendar can
// show a dot/badge without fetching every task for every day up front.
router.get("/summary", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      return res.status(400).json({ message: "month (1-12) and year query params are required" });
    }
    const pad2 = (n) => String(n).padStart(2, "0");
    const start = `${year}-${pad2(month)}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const end = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

    const tasks = await CalendarTask.find(
      { user: req.user._id, date: { $gte: start, $lte: end } },
      { date: 1, completed: 1 }
    );

    const summary = {};
    for (const t of tasks) {
      if (!summary[t.date]) summary[t.date] = { total: 0, completed: 0 };
      summary[t.date].total += 1;
      if (t.completed) summary[t.date].completed += 1;
    }
    res.json(summary);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { date, title } = req.body;
    if (!isValidDateStr(date)) {
      return res.status(400).json({ message: "date is required in YYYY-MM-DD format" });
    }
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required" });
    const trimmed = title.trim();
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ message: `Task title is too long (${MAX_TITLE_LENGTH} characters max)` });
    }

    // New tasks go to the end of that date's list.
    const count = await CalendarTask.countDocuments({ user: req.user._id, date });
    const task = await CalendarTask.create({ user: req.user._id, date, title: trimmed, order: count });
    res.status(201).json(task);
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/calendar-tasks/reorder — drag-and-drop within a single date.
// Body: { date, order: [taskId, taskId, ...] } — the full set of this
// date's task ids in the desired new sequence. Every id must exist, belong
// to the requesting user, and belong to the given date, so this can never
// touch another user's tasks or bleed into a different date's ordering.
router.patch("/reorder", async (req, res) => {
  try {
    const { date, order } = req.body;
    if (!isValidDateStr(date)) {
      return res.status(400).json({ message: "date is required in YYYY-MM-DD format" });
    }
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: "order must be a non-empty array of task ids" });
    }
    if (!order.every(isValidObjectId)) {
      return res.status(400).json({ message: "order contains an invalid task id" });
    }
    if (new Set(order).size !== order.length) {
      return res.status(400).json({ message: "order contains duplicate task ids" });
    }

    const tasks = await CalendarTask.find({ _id: { $in: order }, user: req.user._id, date });
    if (tasks.length !== order.length) {
      return res.status(400).json({ message: "One or more tasks were not found or do not belong to you" });
    }

    await Promise.all(
      order.map((id, index) =>
        CalendarTask.updateOne({ _id: id, user: req.user._id, date }, { $set: { order: index } })
      )
    );

    const updated = await CalendarTask.find({ user: req.user._id, date }).sort({ order: 1, createdAt: 1 });
    res.json(updated);
  } catch (err) {
    sendError(res, err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await CalendarTask.findOne({ _id: req.params.id, user: req.user._id });
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
    const task = await CalendarTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
