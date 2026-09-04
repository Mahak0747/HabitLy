import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"],
    }, // YYYY-MM-DD
    mood: { type: String, enum: ["great", "good", "okay", "low", "rough"], default: "okay" },
    content: { type: String, default: "", maxlength: 5000 },
  },
  { timestamps: true }
);

journalSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Journal", journalSchema);
