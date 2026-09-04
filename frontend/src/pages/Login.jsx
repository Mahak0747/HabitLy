import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Flame size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl">Habitly</span>
        </Link>

        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card border border-ink-900/5 dark:border-white/5 p-7 sm:p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-ink-900/55 dark:text-ink-50/55 mb-6">Log in to keep your streaks going.</p>

          {error && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-900/60 dark:text-ink-50/60 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-900/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-900/40 dark:text-ink-50/40"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-sm text-center text-ink-900/55 dark:text-ink-50/55 mt-6">
            New to Habitly? <Link to="/register" className="text-brand-600 dark:text-brand-300 font-semibold">Create an account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
