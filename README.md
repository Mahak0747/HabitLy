# Habitly — Daily Habit Tracker

A full-stack habit tracker with a signature GitHub-style **monthly habit matrix**, drag-and-drop habit reordering, streaks, goals, journaling, reminders, achievements, a standalone Task Manager, and a light/dark premium dashboard UI.

```
habit-tracker/
├── backend/    Node.js + Express + MongoDB (Mongoose) API, JWT auth
└── frontend/   React + Vite + Tailwind + Framer Motion + dnd-kit
```

## Features

- **Authentication** — register/login with bcrypt-hashed passwords and JWT, protected routes on both API and client.
- **Habits are month-specific** — each habit belongs to one `user + month + year`. Adding, editing, deleting or completing a habit in September never affects October (or any other month), even if the same habit name is reused elsewhere.
- **Monthly Matrix** — the signature feature. Habits as rows, days of the month as columns, click a cell to toggle completion (saved to MongoDB instantly). Sticky habit names, horizontally scrollable on small screens, hover/tap for details, drag the grip handle to reorder habits (persisted per month), delete a habit right from its row.
- **Task Manager** — a completely standalone to-do list (its own `Task` model/collection, its own `/api/tasks` endpoints) for one-off tasks like "Complete assignment": add, mark complete/incomplete, delete, see `n/m completed` at a glance. It has zero connection to the habit system — it never reads or writes habit completions, and nothing it does affects Dashboard stats, streaks, or Monthly Matrix/Analytics.
- **Dashboard** — greeting, today's progress ring, current streak, monthly completion %, today's habit list, motivational quote, quick links.
- **Habits** — CRUD, daily / weekly / custom-day frequency, duplicate names blocked within the same month (allowed across different months), permanent delete (no archive/soft-delete anywhere) with a confirmation modal.
- **Streaks** — current & longest streak calculated per habit from that month's own completion history.
- **Goals** — target-based goals with progress bars.
- **Analytics** — Month + Year selector dropdowns, daily completion trend and per-habit streak charts scoped to whichever month is selected (Recharts).
- **Journal** — one entry per day with a mood picker.
- **Reminders** — time + day-of-week reminders list.
- **Achievements** — badges unlocked from streaks, habit count and completions.
- **Light/Dark mode** — toggle on the landing page navbar and in the dashboard sidebar/settings; persisted in `localStorage` and applied instantly with no flash on load, consistently across every page.
- **Responsive** — sidebar + top bar on desktop, compact app-style header + bottom tab bar on mobile (320–480px tested), matrix and kanban scroll independently without page-level horizontal scroll.

## Month-specific habits

A habit document always belongs to exactly one `user + month + year` (see `backend/models/Habit.js`). This means:

- Adding a habit while viewing September only ever creates a September habit — it's never copied or propagated to other months.
- The same habit name (e.g. "Meditation") can exist independently in different months; each has its own completions, streaks and status.
- Duplicate names are blocked within the same month (case-insensitive) but always allowed in a different month.
- **Deleting a habit is permanent.** There is no archive/soft-delete flag anywhere in this system — `DELETE /api/habits/:id` removes the document (and its embedded completion records) from MongoDB entirely. It only ever touches that one month's instance; other months with the same habit name are untouched, and the deleted habit never reappears after a refresh or month switch. Any Goal or Reminder that referenced the deleted habit has its link cleared automatically rather than being left pointing at a missing document.
- Habits can be freely reordered within a month by dragging the grip handle on each row in the Monthly Matrix (`@dnd-kit/sortable`). The new order is persisted to each habit's `order` field and stays correct after a refresh or navigating away and back. Reordering is inherently month-specific and validated server-side to never touch another month's or another user's habits.
- The Dashboard, Habit Board, Monthly Matrix and Analytics all share one "active month" (`HabitContext`), defaulting to the real current month. The Monthly Matrix's month switcher and the Analytics page's Month/Year dropdowns both move this same shared active month for the whole app — picking a month in either place keeps everything in sync, since there's only ever one source of truth. A banner appears elsewhere when you're viewing a month other than the current one, with a one-tap way back.
- All dates (today, streaks, the matrix's "today" highlight) are computed from local calendar-date components (`getFullYear()/getMonth()/getDate()`), never from `toISOString()`, to avoid timezone off-by-one-day bugs.

## Security & data integrity

- Every resource (habits, goals, journal entries, reminders) is scoped to `req.user._id` from the verified JWT on every read/write — one user can never see, edit, or delete another user's data.
- `Goal.habit` and `Reminder.habit` references are validated server-side: if provided, the id must be a real habit owned by the requesting user, or the request is rejected with a 400.
- All route params and body fields that should be MongoDB ObjectIds are validated before being used in a query, so a malformed id returns a clean 400 instead of a raw database error.
- Input is validated server-side (not just in the UI) for habit names/frequency/custom-days, reminder times/days, journal dates/content length, and goal targets/progress — the frontend's own validation is a convenience, not the enforcement layer.
- Mongoose validation errors, cast errors, and duplicate-key errors are normalized into consistent 400/409 JSON responses instead of leaking internal error details as raw 500s.

## Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a long random JWT_SECRET
npm install
npm run dev        # starts on http://localhost:5000 (nodemon)
# or: npm start
```

`.env` variables:

| Variable        | Description                                      |
|-----------------|---------------------------------------------------|
| `MONGO_URI`     | MongoDB connection string                          |
| `JWT_SECRET`    | Long random string used to sign JWTs               |
| `PORT`          | API port (default `5000`)                          |
| `CLIENT_ORIGIN` | Comma-separated list of allowed frontend origins    |

## 2. Frontend setup

Open a second terminal:

```bash
cd frontend
cp .env.example .env
# edit .env if your backend runs on a different URL
npm install
npm run dev         # starts on http://localhost:5173
```

Visit `http://localhost:5173` in your browser. Register an account, then you'll land on `/app`, the dashboard.

## 3. Production build (frontend)

```bash
cd frontend
npm run build       # outputs static files to frontend/dist
npm run preview     # preview the production build locally
```

Serve `frontend/dist` with any static host, and point `VITE_API_URL` (build-time env var) at your deployed backend.

## API overview

All routes below `/api` except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

| Method & path                       | Purpose                                  |
|--------------------------------------|-------------------------------------------|
| `POST /api/auth/register`            | Create account                            |
| `POST /api/auth/login`               | Log in                                    |
| `GET  /api/auth/me`                  | Current user                              |
| `PUT  /api/auth/theme`               | Save theme preference                     |
| `GET/POST /api/habits`               | List / create habits for a `month`+`year` (query params, default current month) |
| `PUT/DELETE /api/habits/:id`         | Update habit / **permanently delete** a habit (that month's instance only — no archive/soft-delete) |
| `POST /api/habits/:id/toggle`        | Toggle completion for a date              |
| `PATCH /api/habits/:id/status`       | Update habit status (kept for API stability; no longer exposed in the UI since the old habit board was replaced by the independent Task Manager) |
| `PATCH /api/habits/reorder`          | Persist a new drag-and-drop order for one month's habits |
| `GET  /api/stats/overview`           | Dashboard + analytics numbers for a `month`+`year` (query params, default current month) |
| `GET  /api/stats/monthly`            | Data for the monthly matrix, for a `month`+`year` |
| `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id` | Goals CRUD (optional `habit` link, validated as owned by you) |
| `GET/POST /api/journal`, `DELETE /api/journal/:id` | Journal CRUD                |
| `GET/POST /api/reminders`, `PUT/DELETE /api/reminders/:id` | Reminders CRUD (optional `habit` link, validated as owned by you) |
| `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/:id` | Task Manager CRUD — completely independent of `/api/habits`, its own `Task` model/collection |

## Tasks vs. Habits — kept fully independent

The Task Manager (`/app/board` in the UI, `backend/models/Task.js` + `backend/routes/tasks.js` on the backend) is a separate, standalone to-do list with no connection to the habit system:

- Its own MongoDB collection (`tasks`), its own model, its own routes — no `Habit` import anywhere in the task code, and no `Task` import anywhere in the habit code.
- Its own frontend state (`TaskManager.jsx` manages its own local state via direct `/api/tasks` calls) — it never touches `HabitContext`, never reads or writes `habits`, and isn't part of the shared "active month" that Dashboard/Matrix/Analytics use.
- Completing, adding, or deleting a task has zero effect on habit completion records, streaks, monthly completion %, or any Analytics number — and completing or deleting a habit has zero effect on tasks.
- Existing habit data (and the habit `status` field used by the old habit board) was left completely untouched — nothing about the habit schema or existing documents was modified, migrated, or reset to make room for this feature.

## Notes

- All data (habits, completions, goals, journal entries, reminders, tasks) is scoped to the logged-in user via the JWT, and habits are additionally scoped to a specific month + year.
- The monthly matrix and streak calculations are computed on the backend from raw per-date completion records within the selected month, so they stay accurate across daily/weekly/custom-day habits without crossing month boundaries.
- This project was built as a demonstration/starter and has not been deployed anywhere — run it locally following the steps above.
- **Migration note:** habits now require `month`/`year`, and also have an `order` field used for drag-and-drop reordering in the Monthly Matrix. If your database already has habit documents created before this update, they won't have those fields set: they won't appear in any month's view (missing `month`/`year`), and any that do have `month`/`year` but no `order` will simply sort first (missing `order` sorts as the lowest value). For a dev/test database the simplest fix is to drop the `habits` collection and re-add your habits; keep it if you'd rather write a one-off migration to backfill these fields.
