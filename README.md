# Doctor Tracker

Doctor Tracker is a secure admin portal for hospital teams to manage doctors and the patients assigned to them. Administrators sign in, add doctors, register patients under a doctor, and search, filter and edit records at scale, while a dashboard turns the data into live analytics: totals, patients per doctor, registration trends and condition breakdowns. It is a Next.js client talking to a standalone Express + MongoDB REST API, built around index-backed queries and a fast, responsive UI.

## Setup guide

**Prerequisites:** Node.js 18+, and MongoDB running locally (or a MongoDB Atlas connection string).

```bash
# 1. API
cd server
cp .env.example .env        # set MONGODB_URI and a long random JWT_SECRET
npm install
npm run seed                # creates indexes, an admin user, 14 doctors, 220 patients
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
cp .env.example .env.local  # API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Sign in with **admin@doctortracker.com / Admin@123** (created by `npm run seed`; change it before deploying).

| Variable (server/.env) | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing key for session tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | Comma-separated allowed origins for CORS |

| Variable (client/.env.local) | Purpose |
| --- | --- |
| `API_URL` | Express base URL. Next.js proxies `/api/*` to it. Needed at **build** time for `next build`. |

**Production:** `npm start` in `server/`; `npm run build && npm start` in `client/`. Set `NODE_ENV=production` on the API so the auth cookie is `Secure`.

## System architecture

```
 Browser (React, TanStack Query)
    │  fetch('/api/...')  same origin, httpOnly cookie
    ▼
 Next.js 14 (App Router)
    ├─ middleware.js ── no cookie? redirect to /login
    └─ rewrites ─────── /api/*  ──►  Express API (:5000)
                                       ├─ helmet · cors · rate-limit (login)
                                       ├─ protect()  verify JWT, load user
                                       ├─ validate() zod schemas for body/query/params
                                       ├─ routes: auth · doctors · patients · dashboard
                                       └─ error handler (zod, duplicate key, cast, 5xx)
                                                │
                                                ▼
                                            MongoDB
                                    users · doctors · patients
```

**Data flow example (patients page):** typing in the search box is debounced (350 ms) → the filter state changes and page resets to 1 → TanStack Query requests `GET /api/patients?search=…&status=…&page=1` → Express validates the query, builds an index-friendly filter, runs `find` + `countDocuments` in parallel → JSON `{ items, pagination }` returns and the previous page stays visible until the new one arrives.

**Folder layout**

```
server/src  config/ models/ routes/ middleware/ validators/ utils/ scripts/seed.js
client/src  app/(app)/{page,doctors,patients}  app/login  components/  lib/{api,queries,hooks}.js
```

### REST API

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login` · `/logout` | Sets / clears the httpOnly `token` cookie |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/doctors` | Query: `page limit search specialization hospital from to sort` |
| GET | `/api/doctors/meta` | Filter options (specializations, hospitals, doctor list) |
| GET | `/api/doctors/:id` | Single doctor |
| GET / POST | `/api/doctors/:id/patients` | Patients of a doctor (paginated, searchable) / add one |
| DELETE | `/api/doctors/:id/patients/:patientId` | Remove a patient from the doctor |
| GET | `/api/patients` | Query: `page limit search condition status doctor from to sort` |
| GET | `/api/patients/meta` | Distinct conditions and statuses |
| PUT / DELETE | `/api/patients/:id` | Edit (incl. reassigning doctor) / delete |
| GET | `/api/dashboard/stats?days=30` | All dashboard aggregates in one round trip |

All routes except login require authentication. Errors share one shape: `{ message, errors?: { field: [msg] } }`.

## Technical decisions

### 1. Index-backed search and a denormalised `patientCount`

Case-insensitive `contains` regexes (`/term/i`) cannot use an index, so every keystroke would scan the collection. Instead each doctor and patient stores `nameLower` and `nameTokens` (the lowercase words of the name), both indexed. A search is an `$or` of **anchored prefix regexes** (`^kha`) over `nameLower`, `nameTokens` and email/phone, which MongoDB answers from the indexes, and matching any word in a name still works ("khan" finds "Sarah Khan"). Filters have compound indexes such as `{ specialization: 1, createdAt: -1 }`, `{ condition: 1, createdAt: -1 }` and `{ doctor: 1, createdAt: -1 }`, so a filter plus the default sort is one index walk. Sorts include `_id` as a tiebreaker so pagination is stable.

The doctors list and the "patients per doctor" chart both need a patient count. Computing it with `$lookup`/`$group` on every request grows with the patient collection, so the count lives on the doctor (`patientCount`) and is adjusted with `$inc` whenever a patient is added, deleted or reassigned. The trade-off is that the counter can drift if the process dies between the two writes, because a standalone MongoDB has no transactions. On a replica set (Atlas) wrap the two writes in a transaction; a periodic reconcile job (`Patient.aggregate` by doctor) is the safety net.

**Trade-off of prefix search:** it matches the start of a word, not the middle. For true fuzzy or substring search at larger scale, use MongoDB Atlas Search.

### 2. httpOnly JWT cookie behind a Next.js rewrite proxy

Storing a JWT in `localStorage` exposes it to any XSS. Here the API sets it as an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie, so page JavaScript can never read it. Because the API and the web app normally live on different origins, the Next.js app **proxies `/api/*` to Express** with `rewrites`. The browser only talks to one origin, so the cookie is first-party, no CORS preflights are needed, and there is no cross-site cookie configuration to get wrong.

Protection is layered: Next.js `middleware.js` redirects cookie-less visitors to `/login` (a UX gate, not the security boundary); the Express `protect` middleware verifies the JWT and loads the user on every request; `restrictTo('admin')` enforces authorization; and a 401 from the API clears the stale cookie and sends the user to sign in. The login route is rate-limited and returns one generic message for unknown email or wrong password.

## Performance notes

- **Frontend:** TanStack Query caches responses and uses `keepPreviousData`, so pagination and filtering never blank the screen; search is debounced; list rows and charts are wrapped in `React.memo`; shared mutations invalidate only the affected query keys.
- **Backend:** `lean()` reads, list queries return only what the table needs, `find` and `count` run in parallel, and the dashboard runs all aggregates in a single `Promise.all` with `$dateToString` grouping and zero-filled days.
- **Validation:** every body, query string and id is parsed by zod; limits are capped (`limit ≤ 50`).

## Visual evidence

Screenshots go in `docs/screenshots/`. Replace this note with your captures:

| Desktop | Mobile |
| --- | --- |
| `docs/screenshots/dashboard-desktop.png` | `docs/screenshots/dashboard-mobile.png` |
| `docs/screenshots/doctors-desktop.png` | `docs/screenshots/doctors-mobile.png` |
| `docs/screenshots/patients-desktop.png` | `docs/screenshots/patients-mobile.png` |

## Possible next steps

Sync filters to the URL for shareable views, add doctor edit/delete, role-based access beyond `admin`, refresh-token rotation, Atlas Search for substring matching, and automated API tests.
"# doctor-tracker" 
