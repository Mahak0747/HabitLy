import express from "express";
import Journal from "../models/Journal.js";
import { protect } from "../middleware/auth.js";
import { isValidObjectId, isValidDateStr, sendError } from "../utils/apiHelpers.js";

const router = express.Router();
router.use(protect);

const validMoods = ["great", "good", "okay", "low", "rough"];

router.get("/", async (req, res) => {
  try {
    const entries = await Journal.find({ user: req.user._id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { date, mood, content } = req.body;
    if (!isValidDateStr(date)) return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
    if (mood !== undefined && !validMoods.includes(mood)) {
      return res.status(400).json({ message: "Invalid mood" });
    }
    if (content !== undefined && typeof content === "string" && content.length > 5000) {
      return res.status(400).json({ message: "Journal entry is too long (5000 characters max)" });
    }

    const entry = await Journal.findOneAndUpdate(
      { user: req.user._id, date },
      { mood, content },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.json(entry);
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid entry id" });
    const entry = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
