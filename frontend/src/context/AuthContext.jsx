import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

// Reads the `exp` claim out of a JWT without verifying its signature (the
// signature is verified server-side on every request). This just lets the
// app avoid firing a network request with a token it can already tell is
// expired, and skip straight to a clean "logged out" state.
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return false; // no exp claim — let the server decide
    return Date.now() >= payload.exp * 1000;
  } catch {
    // Malformed token — treat as expired/invalid so it gets cleared below.
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("habitly_token");
    if (!token) {
      setLoading(false);
      return;
    }
    if (isTokenExpired(token)) {
      // Stored token is expired or malformed — clear the stale auth state
      // and fall through to the normal logged-out flow (redirect to Login)
      // rather than assuming it's still valid.
      localStorage.removeItem("habitly_token");
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      // Token was rejected by the server (invalid, revoked, user deleted,
      // etc.) — clear it so the user cleanly lands on Login instead of a
      // broken authenticated-looking state.
      localStorage.removeItem("habitly_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("habitly_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("habitly_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("habitly_token");
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    const { data } = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    // Backend issues a fresh token after a successful change so the current
    // session keeps working without forcing the user to log in again.
    if (data.token) localStorage.setItem("habitly_token", data.token);
    if (data.user) setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout, changePassword, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
