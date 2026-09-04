import express from "express";
import Reminder from "../models/Reminder.js";
import Habit from "../models/Habit.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, sendError } from "../utils/apiHelpers.js";

const router = express.Router();
router.use(protect);

const isValidTime = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const isValidDays = (days) =>
  Array.isArray(days) && days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);

// Same pattern as Goals: a reminder's `habit` link, if provided, must
// point at a real habit owned by this user.
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
    const reminders = await Reminder.find({ user: req.user._id }).sort({ time: 1 });
    res.json(reminders);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, time, days, habit } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!isValidTime(time)) return res.status(400).json({ message: "time must be in HH:MM (24h) format" });
    if (days !== undefined && !isValidDays(days)) {
      return res.status(400).json({ message: "days must be a non-empty array of integers 0-6" });
    }

    let habitId;
    try {
      habitId = await resolveOwnedHabit(habit, req.user._id);
    } catch (e) {
      return res.status(e.status || 400).json({ message: e.message });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title: title.trim(),
      time,
      days,
      habit: habitId,
    });
    res.status(201).json(reminder);
  } catch (err) {
    sendError(res, err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid reminder id" });

    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    if (req.body.time !== undefined && !isValidTime(req.body.time)) {
      return res.status(400).json({ message: "time must be in HH:MM (24h) format" });
    }
    if (req.body.days !== undefined && !isValidDays(req.body.days)) {
      return res.status(400).json({ message: "days must be a non-empty array of integers 0-6" });
    }
    if (req.body.habit !== undefined) {
      try {
        reminder.habit = await resolveOwnedHabit(req.body.habit, req.user._id);
      } catch (e) {
        return res.status(e.status || 400).json({ message: e.message });
      }
    }
    if (req.body.title !== undefined && !req.body.title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const fields = ["title", "time", "days", "active"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) reminder[f] = req.body[f];
    });
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid reminder id" });
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
