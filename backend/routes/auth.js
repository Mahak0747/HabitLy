import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { sendError } from "../utils/apiHelpers.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !name.trim() || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    const trimmedName = name.trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    if (trimmedName.length > 120) {
      return res.status(400).json({ message: "Name is too long (120 characters max)" });
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: "Password is too long (128 characters max)" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const colors = ["#6366F1", "#8B5CF6", "#06B6D4", "#F59E0B", "#EC4899"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await User.create({ name: trimmedName, email: normalizedEmail, password, avatarColor });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Please provide email and password" });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

router.put("/theme", protect, async (req, res) => {
  try {
    const { theme } = req.body;
    req.user.theme = theme === "dark" ? "dark" : "light";
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
