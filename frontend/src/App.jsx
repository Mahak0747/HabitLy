import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { HabitProvider } from "./context/HabitContext.jsx";

import Home from "./pages/dashboard/Home.jsx";
import MonthlyMatrix from "./pages/dashboard/MonthlyMatrix.jsx";
import TaskManager from "./pages/dashboard/TaskManager.jsx";
import Goals from "./pages/dashboard/Goals.jsx";
import Analytics from "./pages/dashboard/Analytics.jsx";
import Journal from "./pages/dashboard/Journal.jsx";
import Reminders from "./pages/dashboard/Reminders.jsx";
import Achievements from "./pages/dashboard/Achievements.jsx";
import Settings from "./pages/dashboard/Settings.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <HabitProvider>
              <DashboardLayout />
            </HabitProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="matrix" element={<MonthlyMatrix />} />
        <Route path="board" element={<TaskManager />} />
        <Route path="goals" element={<Goals />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="journal" element={<Journal />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;
