# SaniTrust — Public Toilet & Sanitation Trust Index

## Why this design

The core aim of the problem statement isn't to let people rate toilets because
plenty of apps do that already. It's the **discrepancy engine**: comparing crowd
sentiment against official records to catch cases where a facility has been
broken for weeks but the municipal record still says "operational" because
nobody logged it. That comparison is the actual product, so it's implemented
as its own module (`backend/logic.js`) rather than being inside a route
handler.

**Two front doors, one dataset.** Citizens get a map to locate public toilets with ease(`/`); municipal staff
get a prioritized repair queue (`/admin`). Same underlying facilities, two
different lenses on them — which mirrors how the real system would be used.
Access to each is now backed by real accounts, not just separate URLs (see
**Authentication** below).

## Architecture

```
sanitrust/
├── backend/                 Express API + JSON-file data store
│   ├── db.js                 tiny hand-rolled persistence layer
│   ├── auth.js                 password hashing + session tokens
│   ├── logic.js               discrepancy + priority scoring
│   ├── seed.js                 mock facilities & checkins (Bhubaneswar)
│   ├── routes/facilities.js     REST endpoints
│   ├── routes/auth.js           signup / login / session check
│   └── server.js                entry point
└── frontend/                React (Vite) app
    └── src/
        ├── api.js                fetch client (attaches session token)
        ├── context/AuthContext.jsx  session state, login/signup/logout
        ├── pages/LoginPage.jsx      combined login + signup, role select
        ├── pages/CitizenMap.jsx   Leaflet map + facility detail
        ├── pages/AdminDashboard.jsx  priority repair queue
        └── components/           StatusBadge, CheckInForm, ProtectedRoute, etc.
```

The best part is that there are No external databases, no paid map API — the map uses OpenStreetMap tiles
and Leaflet, and persistence is a JSON file. This is actually deliberate: it means
the whole thing runs on a laptop without accounts, keys, or billing setup.

## How the discrepancy logic works

For each facility, we follow the following protocol:
1. Take the last 5 citizen check-ins, majority-vote a **crowd status**
   (`functional` / `dirty` / `broken`), breaking ties toward the worse
   status because for a public-health tool, a false alarm is cheaper than a
   missed one.
2. Compare that against the facility's **official record**. If the crowd
   says there's a problem, the official record says "operational," *and*
   that record hasn't been touched in 7+ days, the facility is flagged.
3. **Priority score** = crowd-severity weight × 10 + days the record has
   gone stale (capped at 30) + number of corroborating negative reports.

## Authentication

Both check-ins and municipal actions are now backed by real accounts
rather than open routes:

- **Password storage** — `crypto.scryptSync` with a random salt per user
  (`salt:derivedKey`, hex-encoded). No plaintext passwords stored, and no
  external hashing library — scrypt is built into Node.
- **Session tokens** — hand-rolled, JWT-shaped but dependency-free:
  `base64url(JSON payload) + "." + HMAC-SHA256 signature`, signed with a
  server-side secret. Verification checks the signature with a
  constant-time comparison, then checks expiry (7-day TTL). No external
  JWT library.
- **Roles** — `citizen` or `municipal`, chosen at signup. Enforcement is
  server-side, not just a hidden UI link: `/api/flagged` and
  `/api/facilities/:id/official-update` require `requireAuth` +
  `requireRole("municipal")`; `/api/facilities/:id/checkins` requires
  `requireAuth` (any logged-in role can check in). Viewing the map
  (`GET /api/facilities`) stays public.
- **Frontend** — `AuthContext` holds session state and persists the token
  in `localStorage`, restoring it via `GET /api/auth/me` on page load.
  `ProtectedRoute` gates `/admin` behind both login and the `municipal`
  role, redirecting to `/login` (and back again after a successful
  sign-in). The check-in form shows a "sign in to report" prompt instead
  of submitting anonymously.
- **Re-seeding** (`npm run seed`) resets the demo facilities/check-ins but
  preserves any accounts people have already signed up with.
  
## Running it locally

You'll need Node.js 18+ installed. Two terminals:

**Terminal 1 — backend**
```bash
cd backend
npm install
npm run seed     # populates data/store.json with mock facilities
npm start        # runs on http://localhost:4000
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev       # runs on http://localhost:5173
```

Open `http://localhost:5173`. The dev server proxies `/api` calls to the
backend automatically (see `frontend/vite.config.js`), so you don't need
to configure CORS ports by hand.

This is temprorary.

## What we'd add with more time

- Photo evidence attached to check-ins
- SMS/IVR check-in for citizens without smartphones (genuinely important
  for this use case — the target users of public toilets skew toward
  people less likely to have a data connection)
- Real persistence (Postgres) once beyond hackathon scope
- Email verification and password reset for the accounts system
- Rate-limiting check-ins per account to make the crowd signal harder to
  game
