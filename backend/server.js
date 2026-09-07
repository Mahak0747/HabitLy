dotenv.config();
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import goalRoutes from "./routes/goals.js";
import journalRoutes from "./routes/journal.js";
import reminderRoutes from "./routes/reminders.js";
import statsRoutes from "./routes/stats.js";
import taskRoutes from "./routes/tasks.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);


const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Cap request body size — every route here only ever needs small JSON
// payloads (habit names, journal text, etc.), so a generous-but-bounded
// limit blocks oversized-payload abuse without affecting real usage.
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tasks", taskRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "Malformed JSON in request body" });
  }
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
