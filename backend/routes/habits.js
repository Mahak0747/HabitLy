import express from "express";
import Habit from "../models/Habit.js";
import Goal from "../models/Goal.js";
import Reminder from "../models/Reminder.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, isValidDateStr, sendError } from "../utils/apiHelpers.js";

const router = express.Router();
router.use(protect);

// Resolve the month/year a request is scoped to. Falls back to the real
// current month/year (server local time) when not provided, so existing
// callers that don't yet send month/year keep working exactly as before.
const resolveMonthYear = (query) => {
  const now = new Date();
  let month = parseInt(query.month, 10);
  let year = parseInt(query.year, 10);
  if (!month || month < 1 || month > 12) month = now.getMonth() + 1;
  if (!year || Number.isNaN(year)) year = now.getFullYear();
  return { month, year };
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET all habits for the logged-in user, scoped to one month + year, in
// their saved display order. Habits belong to a single month — this never
// returns habits created in other months, and never mixes their
// completion records. There is no archived/soft-delete flag anywhere in
// this system, so this is always exactly what's really in MongoDB.
router.get("/", async (req, res) => {
  try {
    const { month, year } = resolveMonthYear(req.query);
    const habits = await Habit.find({ user: req.user._id, month, year }).sort({ order: 1, createdAt: 1 });
    res.json(habits);
  } catch (err) {
    sendError(res, err);
  }
});

// CREATE habit — always tied to a specific month + year (defaults to the
// current real month/year if none is supplied). Duplicate names are
// rejected within that same month/year, but the same name is always
// allowed in a different month. New habits are appended to the end of
// that month's display order.
router.post("/", async (req, res) => {
  try {
    const { name, icon, color, frequency, customDays, reminderTime } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Habit name is required" });
    const { month, year } = resolveMonthYear(req.body);
    const trimmedName = name.trim();

    if (trimmedName.length > 120) {
      return res.status(400).json({ message: "Habit name is too long (120 characters max)" });
    }
    if (frequency && !["daily", "weekly", "custom"].includes(frequency)) {
      return res.status(400).json({ message: "Invalid frequency" });
    }
    if (customDays !== undefined) {
      if (!Array.isArray(customDays) || !customDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        return res.status(400).json({ message: "customDays must be an array of integers 0-6" });
      }
    }

    const existing = await Habit.findOne({
      user: req.user._id,
      month,
      year,
      name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ message: `You already have a habit named "${trimmedName}" for this month.` });
    }

    const habitCount = await Habit.countDocuments({ user: req.user._id, month, year });

    const habit = await Habit.create({
      user: req.user._id,
      name: trimmedName,
      icon,
      color,
      month,
      year,
      frequency,
      customDays,
      reminderTime,
      order: habitCount,
    });
    res.status(201).json(habit);
  } catch (err) {
    sendError(res, err);
  }
});

// REORDER habits within a single month — drag-and-drop in the Monthly
// Matrix. `order` is the full list of habit ids for that month, in the
// desired new sequence. Every id must exist, belong to the requesting
// user, and belong to the same month/year — this can never touch another
// user's habits or reorder habits across different months.
router.patch("/reorder", async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: "order must be a non-empty array of habit ids" });
    }
    if (!order.every(isValidObjectId)) {
      return res.status(400).json({ message: "order contains an invalid habit id" });
    }
    if (new Set(order).size !== order.length) {
      return res.status(400).json({ message: "order contains duplicate habit ids" });
    }

    const habits = await Habit.find({ _id: { $in: order }, user: req.user._id });
    if (habits.length !== order.length) {
      return res.status(400).json({ message: "One or more habits were not found or do not belong to you" });
    }

    const { month, year } = habits[0];
    const allSameMonth = habits.every((h) => h.month === month && h.year === year);
    if (!allSameMonth) {
      return res.status(400).json({ message: "All habits being reordered must belong to the same month" });
    }

    await Promise.all(
      order.map((id, index) => Habit.updateOne({ _id: id, user: req.user._id }, { $set: { order: index } }))
    );

    const updated = await Habit.find({ user: req.user._id, month, year }).sort({ order: 1, createdAt: 1 });
    res.json(updated);
  } catch (err) {
    sendError(res, err);
  }
});

// UPDATE habit (name, icon, color, frequency, status, reminder).
// Month/year are intentionally not editable here — a habit stays in the
// month it was created in; renaming still respects the per-month
// uniqueness rule.
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid habit id" });

    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    if (req.body.name !== undefined) {
      const trimmedName = req.body.name.trim();
      if (!trimmedName) return res.status(400).json({ message: "Habit name is required" });
      if (trimmedName.length > 120) {
        return res.status(400).json({ message: "Habit name is too long (120 characters max)" });
      }
      if (trimmedName.toLowerCase() !== habit.name.toLowerCase()) {
        const existing = await Habit.findOne({
          _id: { $ne: habit._id },
          user: req.user._id,
          month: habit.month,
          year: habit.year,
          name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
        });
        if (existing) {
          return res.status(409).json({ message: `You already have a habit named "${trimmedName}" for this month.` });
        }
      }
      habit.name = trimmedName;
    }

    if (req.body.frequency !== undefined && !["daily", "weekly", "custom"].includes(req.body.frequency)) {
      return res.status(400).json({ message: "Invalid frequency" });
    }
    if (req.body.customDays !== undefined) {
      if (!Array.isArray(req.body.customDays) || !req.body.customDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        return res.status(400).json({ message: "customDays must be an array of integers 0-6" });
      }
    }
    if (req.body.status !== undefined && !["done", "working", "not-started"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const fields = ["icon", "color", "frequency", "customDays", "status", "reminderTime"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) habit[f] = req.body[f];
    });
    await habit.save();
    res.json(habit);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE habit — PERMANENT. There is no archive/soft-delete flag anywhere
// in this system: this removes the document (and its embedded
// completions) from MongoDB entirely. It only ever touches this one
// month's habit instance; any same-named habit in another month is a
// completely separate document and is untouched. Any Goals or Reminders
// that reference this habit are detached (their `habit` link is cleared)
// rather than deleted, so they don't end up pointing at a document that no
// longer exists.
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid habit id" });

    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    await Promise.all([
      Goal.updateMany({ habit: habit._id, user: req.user._id }, { $set: { habit: null } }),
      Reminder.updateMany({ habit: habit._id, user: req.user._id }, { $set: { habit: null } }),
    ]);

    res.json({ message: "Habit permanently deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

// TOGGLE completion for a specific date (used by the monthly matrix + today's habits)
router.post("/:id/toggle", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid habit id" });

    const { date } = req.body; // YYYY-MM-DD
    if (!isValidDateStr(date)) return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });

    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const idx = habit.completions.findIndex((c) => c.date === date);
    if (idx >= 0) {
      habit.completions.splice(idx, 1); // toggling off removes the record
    } else {
      habit.completions.push({ date, completed: true });
    }
    await habit.save();
    res.json(habit);
  } catch (err) {
    sendError(res, err);
  }
});

// UPDATE kanban status only (drag & drop)
router.patch("/:id/status", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid habit id" });

    const { status } = req.body;
    if (!["done", "working", "not-started"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    );
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json(habit);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
