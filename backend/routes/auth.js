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

// Change password for the authenticated user. Requires the current password
// to be re-verified server-side (never trust the client), enforces the same
// minimum-length rule used at signup, and re-signs a fresh token afterwards
// so the session the user is still using keeps working without forcing a
// re-login, while any other/stale tokens naturally expire on their own.
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ message: "New password is too long (128 characters max)" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    // req.user came from `.select("-password")` in the auth middleware, so
    // re-fetch with the password field to verify the current password.
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    const samePassword = await user.comparePassword(newPassword);
    if (samePassword) {
      return res.status(400).json({ message: "New password must be different from the current password" });
    }

    user.password = newPassword; // hashed automatically by the pre("save") hook
    await user.save();

    // Issue a fresh token so the session that just changed the password
    // keeps working seamlessly.
    const token = signToken(user._id);
    res.json({ message: "Password changed successfully", token, user: user.toSafeObject() });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
