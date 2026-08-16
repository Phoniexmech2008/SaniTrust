# SaniTrust — Public Toilet & Sanitation Trust Index

**PS-13.** A crowd-verified real-time status tool for public toilets. Citizens
check in and rate facilities; the system cross-checks those reports against
official municipal maintenance records and flags facilities that have been
silently broken for longer than the record admits.

## This session's changes

**1. Reconstructed the backend auth wiring.** The zip you'd exported from an
earlier session had `backend/auth.js` (password hashing + token helpers) and
a fully-built auth-aware frontend (`AuthContext`, `ProtectedRoute`,
`LoginPage`, sign-in-aware `Layout`), but was missing three files that never
made it into the export: `backend/server.js`, `backend/routes/auth.js` (the
actual signup/login/me *endpoints* — as opposed to the crypto helpers that
back them), and both `package.json` files. All four are rebuilt below,
matching exactly what the existing frontend `api.js` already expects. I
verified the password hashing, token signing, and tamper-detection logic
directly before handing it back — see the transcript if you want the details.

**2. Added "toilets near me" radius search.** New on the citizen map:
- A **📍 Toilets near me** button that requests your browser location
- Once enabled, a **slider (0.5–10 km)** filters the map to nearby facilities
- Your location shows as a pulsing blue marker, with a translucent circle
  showing the current search radius
- Facility tooltips and the detail panel show distance in km

New files: `frontend/src/utils/geo.js` (haversine distance),
`frontend/src/hooks/useGeolocation.js` (wraps the browser Geolocation API),
`frontend/src/components/RadiusControl.jsx` (the slider UI). Distance
filtering happens entirely client-side — the backend doesn't need to know
about it.

## This session's changes (continued)

Picking up after the above — three items, each verified against real code
execution before being called done (see the note at the bottom about what
that testing could and couldn't cover in this sandbox):

**3. Manual location fallback.** Browser geolocation genuinely can fail —
denied permission, no GPS, OS location services off — and there was no way
around that before now. "Toilets near me" now also offers **"Set location
manually"**: the map enters a crosshair pick-mode and a tap anywhere sets
that point as your location, exactly as if geolocation had succeeded. Once
a location is set (either way), **"Reposition manually"** lets you correct
it at any time. This also makes the demo itself failure-proof — if location
permission misbehaves on stage, tap "set manually" instead.

Changed: `LeafletMap.jsx` (added a click-to-pick layer + crosshair cursor
while active), `RadiusControl.jsx` (manual-entry buttons + picking banner),
`CitizenMap.jsx` (now owns a single `location` state that accepts either a
geolocation result or a manual pick, so the rest of the page treats them
identically).

**4. Rate-limiting on check-ins.** A logged-in account could otherwise spam
a single facility to force its crowd status, or spam broadly to look like
organic traffic. Two rules, computed straight from existing checkin history
(no separate tracker to lose on a server restart):
- **Per-facility cooldown** — 10 minutes between check-ins by the same user
  on the same facility.
- **Global cap** — 5 check-ins per user per rolling hour, across any
  facilities.

New file: `backend/rateLimit.js`. This is a different thing from the
signup/login brute-force protection still listed under "what we'd add" below
— that one's about failed login attempts, this one's about the integrity of
the crowd-status signal itself.

**5. Photo evidence on check-ins.** Optional photo attachment, entirely
client-compressed before it ever leaves the browser — resized to a 1000px
longest side and re-encoded as JPEG at 70% quality
(`frontend/src/utils/imageCompress.js`), so even a multi-MB phone photo
becomes a small upload. Stored as a base64 data URL directly in the JSON
store (`backend/photoValidation.js` re-validates type/size server-side —
JPEG/PNG/WebP only, ~1.5MB cap, SVG explicitly rejected since it can carry
scripts). Shows as a thumbnail in the check-in form and full-size in each
facility's report history.

## Architecture

```
sanitrust/
├── backend/
│   ├── auth.js                 password hashing (scrypt) + signed tokens (HMAC)
│   ├── db.js                    JSON-file persistence
│   ├── logic.js                  discrepancy + priority scoring
│   ├── rateLimit.js               check-in cooldown + hourly cap
│   ├── photoValidation.js          check-in photo type/size validation
│   ├── seed.js                    mock facilities & checkins (Bhubaneswar)
│   ├── routes/
│   │   ├── auth.js                 POST /signup, /login, GET /me
│   │   └── facilities.js            facility CRUD, protected by requireAuth/requireRole
│   └── server.js                     entry point, mounts both routers
└── frontend/
    └── src/
        ├── api.js                    fetch client, attaches bearer token
        ├── context/AuthContext.jsx    session state, login/signup/logout
        ├── components/
        │   ├── ProtectedRoute.jsx      route guard by login/role
        │   ├── RadiusControl.jsx        near-me slider + manual location UI
        │   ├── LeafletMap.jsx            markers, user location, click-to-pick
        │   ├── CheckInForm.jsx            report form + photo attach
        │   └── FacilityPanel.jsx           detail panel + report history/photos
        ├── hooks/useGeolocation.js     browser location wrapper
        ├── utils/
        │   ├── geo.js                    haversine distance
        │   └── imageCompress.js           client-side photo downscaling
        └── pages/
            ├── CitizenMap.jsx            map + radius search + location state
            ├── LoginPage.jsx               sign in / sign up
            └── AdminDashboard.jsx           municipal-only repair queue
```

## How auth works

- **Passwords**: hashed with Node's built-in `scrypt` (memory-hard, no
  native `bcrypt` dependency) plus a random salt per user.
- **Sessions**: a hand-rolled signed token — `base64url(payload) + "." +
  HMAC-SHA256(payload)` — same shape as a JWT, verified server-side on every
  protected request. No session storage needed; the signature *is* the proof.
- **Roles**: `citizen` or `municipal`, chosen at signup. Checking in on a
  facility requires being logged in (either role); viewing and resolving the
  admin repair queue requires the `municipal` role specifically.
- Map viewing itself stays public — no login wall just to look at the map.

## How the discrepancy logic works

For each facility: take the last 5 citizen check-ins, majority-vote a crowd
status (ties break toward the worse status). If the crowd says there's a
problem, the official record says "operational," and that record hasn't been
touched in 7+ days, the facility is flagged. Priority score = crowd-severity
weight × 10 + days stale (capped at 30) + number of corroborating reports.
Full logic in `backend/logic.js`.

## Running it locally

Node.js 18+ required. Two terminals:

**Terminal 1 — backend**
```bash
cd backend
npm install
npm run seed     # populates data/store.json (preserves existing user accounts)
npm start         # http://localhost:4000
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend dev server proxies `/api` to the backend automatically — no
CORS setup needed (see `frontend/vite.config.js`).

**To try "near me"**: your browser will prompt for location permission when
you click "Toilets near me." On `localhost` this works without HTTPS; if you
ever deploy this, geolocation requires an HTTPS origin. If permission is
denied or geolocation fails for any reason, click **"Set location
manually"** and tap a point on the map instead — no permission needed.

## Demo script (suggested)

1. **Sign up** as a citizen, then in another browser/incognito window sign up
   as municipal staff — shows the role-based access working live.
2. On the **Citizen Map**, click "Toilets near me." If location permission
   is denied or acts up (it's real geolocation — it can genuinely fail),
   click **"Set location manually"** and tap a spot on the map instead —
   worth calling out explicitly, since it's the fix for a real bug and a
   deliberate fallback, not just a demo trick.
3. Drag the radius slider — narrate that this is client-side filtering
   against the same dataset, not a different query.
4. Click a flagged (red) marker, submit a check-in — note it requires
   login, then attach a photo to show the evidence pipeline.
5. Immediately try to check in on the same facility again — show the
   rate-limit message rather than letting it through silently.
6. Switch to the **Municipal Dashboard** (only visible/accessible to the
   municipal account) — walk through the priority queue, open a flagged
   facility's history to show the attached photo, and resolve one.

## What we'd add with more time

- SMS/IVR check-in for citizens without smartphones or reliable location
  access — genuinely important, since public-toilet users skew toward
  people less likely to have a data connection
- Rate-limiting on signup/login specifically, to blunt brute-force
  credential-guessing attempts (separate from the check-in rate-limiting
  already in place, which protects the crowd-status signal, not the
  accounts system)
- Real persistence (Postgres) once beyond hackathon scope
- Email verification and password reset for the accounts system.
