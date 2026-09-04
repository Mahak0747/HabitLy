import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, Smile, Meh, Frown, Sun, CloudRain } from "lucide-react";
import api from "../../api/axios.js";
import { todayStr } from "../../utils/helpers.js";

const moods = [
  { id: "great", label: "Great", icon: Sun, color: "#F59E0B" },
  { id: "good", label: "Good", icon: Smile, color: "#10B981" },
  { id: "okay", label: "Okay", icon: Meh, color: "#6C63F2" },
  { id: "low", label: "Low", icon: Frown, color: "#8B5CF6" },
  { id: "rough", label: "Rough", icon: CloudRain, color: "#EF4444" },
];

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState("okay");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/journal");
    setEntries(data);
    const existing = data.find((e) => e.date === todayStr());
    if (existing) { setMood(existing.mood); setContent(existing.content); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/journal", { date, mood, content });
      setEntries((prev) => {
        const others = prev.filter((e) => e.date !== date);
        return [data, ...others].sort((a, b) => (a.date < b.date ? 1 : -1));
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/journal/${id}`);
    setEntries((prev) => prev.filter((e) => e._id !== id));
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Journal</h1>
        <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mt-1">A few lines a day, next to the habits that shaped it.</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm"
          />
          <div className="flex gap-1.5">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                title={m.label}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors"
                style={{
                  borderColor: mood === m.id ? m.color : "transparent",
                  backgroundColor: mood === m.id ? `${m.color}1a` : "transparent",
                }}
              >
                <m.icon size={16} style={{ color: m.color }} />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="How did today go?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
        />
        <button
          onClick={save}
          disabled={saving}
          className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
        >
          <Save size={15} /> {saving ? "Saving..." : "Save entry"}
        </button>
      </div>

      <div>
        <h2 className="font-display font-semibold mb-3 text-sm text-ink-900/60 dark:text-ink-50/60">Past entries</h2>
        {loading ? (
          <p className="text-sm text-ink-900/40 dark:text-ink-50/40">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink-900/40 dark:text-ink-50/40">No entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const m = moods.find((x) => x.id === e.mood) || moods[2];
              return (
                <div key={e._id} className="rounded-xl bg-white dark:bg-ink-900 border border-ink-900/5 dark:border-white/5 shadow-card p-4 flex gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}1a` }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink-900/50 dark:text-ink-50/50">
                        {new Date(e.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <button onClick={() => remove(e._id)} className="text-ink-900/25 dark:text-ink-50/25 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{e.content || <span className="italic text-ink-900/35 dark:text-ink-50/35">No note</span>}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
