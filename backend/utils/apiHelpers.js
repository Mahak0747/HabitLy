import mongoose from "mongoose";

// Validates a route param / body field looks like a real MongoDB ObjectId
// before it's ever handed to a query. Without this, an invalid id (typo,
// tampered request, id belonging to a different collection entirely) makes
// Mongoose throw a CastError that — if not handled — surfaces as a raw
// 500 with an internal stack message instead of a clean 400.
export const isValidObjectId = (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

// Centralized error responder used across every route's catch block, so
// validation failures and bad-input errors consistently come back as 400s
// (not 500s with leaked Mongoose internals), duplicate-key violations come
// back as 409s, and only genuinely unexpected errors are logged + reported
// as 500.
export const sendError = (res, err) => {
  if (err?.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message: message || "Invalid data" });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid id format" });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "A record with these details already exists" });
  }
  console.error(err);
  return res.status(500).json({ message: "Something went wrong on the server" });
};

// YYYY-MM-DD, used for both habit completion dates and journal entry dates.
export const isValidDateStr = (str) => typeof str === "string" && /^\d{4}-\d{2}-\d{2}$/.test(str);
