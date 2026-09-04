import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const HabitContext = createContext(null);

const now = new Date();

export const HabitProvider = ({ children }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // The single "active month" every screen is scoped to. Habits belong to
  // exactly one month + year, so Dashboard, Monthly Matrix and Analytics all
  // read/write the same month's data by sharing this state — there is no
  // separate, independently-fetched copy anywhere. It defaults to the real
  // current month/year on load; the Monthly Matrix's month switcher (or
  // Analytics' Month/Year selector) is what moves it elsewhere.
  const [activeMonth, setActiveMonthState] = useState(now.getMonth() + 1);
  const [activeYear, setActiveYearState] = useState(now.getFullYear());

  const isRealCurrentMonth = useMemo(
    () => activeMonth === now.getMonth() + 1 && activeYear === now.getFullYear(),
    [activeMonth, activeYear]
  );

  const setActiveMonth = useCallback((month, year) => {
    setActiveMonthState(month);
    setActiveYearState(year);
  }, []);

  const goToCurrentMonth = useCallback(() => {
    const n = new Date();
    setActiveMonthState(n.getMonth() + 1);
    setActiveYearState(n.getFullYear());
  }, []);

  const fetchHabits = useCallback(async () => {
    const { data } = await api.get("/habits", { params: { month: activeMonth, year: activeYear } });
    setHabits(data);
    return data;
  }, [activeMonth, activeYear]);

  const fetchOverview = useCallback(async () => {
    const { data } = await api.get("/stats/overview", { params: { month: activeMonth, year: activeYear } });
    setOverview(data);
    return data;
  }, [activeMonth, activeYear]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchHabits(), fetchOverview()]);
    } finally {
      setLoading(false);
    }
  }, [fetchHabits, fetchOverview]);

  // Re-fetch whenever the logged-in user changes OR the active month/year
  // changes — this is what makes switching months load that month's
  // independent data (and a refresh always reloads the correct month).
  useEffect(() => {
    if (user) refreshAll();
    else {
      setHabits([]);
      setOverview(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeMonth, activeYear]);

  // New habits are always created in the currently active month/year — so
  // adding a habit while viewing September only ever creates a September
  // habit, never touching October or any other month.
  const createHabit = async (payload) => {
    const { data } = await api.post("/habits", { ...payload, month: activeMonth, year: activeYear });
    setHabits((prev) => [...prev, data]);
    await fetchOverview();
    return data;
  };

  const updateHabit = async (id, payload) => {
    const { data } = await api.put(`/habits/${id}`, payload);
    setHabits((prev) => prev.map((h) => (h._id === id ? data : h)));
    await fetchOverview();
    return data;
  };

  // Deletes only this one habit document — which, since habits are
  // month-scoped, means only this month's instance (and its embedded
  // completions) is removed. Any same-named habit in another month is
  // untouched.
  const deleteHabit = async (id) => {
    await api.delete(`/habits/${id}`);
    setHabits((prev) => prev.filter((h) => h._id !== id));
    await fetchOverview();
  };

  // Single source of truth for completion state: every screen (Dashboard,
  // Monthly Matrix, Analytics) reads completions off `habits`
  // in this context, and every toggle — wherever it's triggered from —
  // goes through this one function. We update optimistically so the whole
  // app reflects the change instantly, then reconcile with the server
  // response (and roll back if the request fails).
  const toggleCompletion = async (id, date) => {
    let previousHabits;
    setHabits((prev) => {
      previousHabits = prev;
      return prev.map((h) => {
        if (h._id !== id) return h;
        const exists = h.completions?.some((c) => c.date === date);
        const completions = exists
          ? h.completions.filter((c) => c.date !== date)
          : [...(h.completions || []), { date, completed: true }];
        return { ...h, completions };
      });
    });

    try {
      const { data } = await api.post(`/habits/${id}/toggle`, { date });
      setHabits((prev) => prev.map((h) => (h._id === id ? data : h)));
      fetchOverview();
      return data;
    } catch (err) {
      // roll back the optimistic change if the server call failed
      setHabits(previousHabits);
      throw err;
    }
  };

  const updateStatus = async (id, status) => {
    setHabits((prev) => prev.map((h) => (h._id === id ? { ...h, status } : h)));
    const { data } = await api.patch(`/habits/${id}/status`, { status });
    setHabits((prev) => prev.map((h) => (h._id === id ? data : h)));
    return data;
  };

  // Persist a new drag-and-drop order for the Monthly Matrix. `orderedIds`
  // is the full list of this month's habit ids in their new sequence.
  // Updates the shared `habits` array optimistically (so every screen
  // reflects the new order instantly), then confirms with the server and
  // rolls back if the request fails. Ordering is inherently month-specific
  // since a habit document only ever belongs to one month.
  const reorderHabits = async (orderedIds) => {
    let previousHabits;
    setHabits((prev) => {
      previousHabits = prev;
      const byId = new Map(prev.map((h) => [h._id, h]));
      const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      // keep any habits not included in orderedIds (shouldn't normally
      // happen) appended at the end, so nothing silently disappears
      const remaining = prev.filter((h) => !orderedIds.includes(h._id));
      return [...reordered, ...remaining];
    });

    try {
      const { data } = await api.patch("/habits/reorder", {
        order: orderedIds,
        month: activeMonth,
        year: activeYear,
      });
      setHabits(data);
      return data;
    } catch (err) {
      setHabits(previousHabits);
      throw err;
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        overview,
        loading,
        refreshAll,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleCompletion,
        updateStatus,
        reorderHabits,
        activeMonth,
        activeYear,
        isRealCurrentMonth,
        setActiveMonth,
        goToCurrentMonth,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => useContext(HabitContext);
