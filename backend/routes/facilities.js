// routes/facilities.js
// REST endpoints for the citizen map view and the admin dashboard.
// All the "is this actually a problem" reasoning lives in logic.js —
// these handlers just wire HTTP to it.

import { Router } from "express";
import { readStore, mutateStore } from "../db.js";
import { computeFacilityStatus, rankFlagged } from "../logic.js";
import { requireAuth, requireRole } from "../auth.js";

export const facilitiesRouter = Router();

// Map viewing stays public — no reason to force a login just to look at
// facility status. Only *acting* (checking in, resolving) requires auth.

// GET /api/facilities
// Every facility, each with computed crowd status + discrepancy flag.
// This is what the map view renders.
facilitiesRouter.get("/facilities", (req, res) => {
  const { facilities, checkins } = readStore();
  const withStatus = facilities.map((f) => computeFacilityStatus(f, checkins));
  res.json(withStatus);
});

// GET /api/facilities/:id
// One facility plus its full checkin history, newest first.
facilitiesRouter.get("/facilities/:id", (req, res) => {
  const { facilities, checkins } = readStore();
  const facility = facilities.find((f) => f.id === req.params.id);
  if (!facility) return res.status(404).json({ error: "Facility not found" });

  const history = checkins
    .filter((c) => c.facilityId === facility.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({ ...computeFacilityStatus(facility, checkins), history });
});

// POST /api/facilities/:id/checkins
// body: { overall: "functional"|"dirty"|"broken", aspects: {water,lighting,lock}, comment }
// Requires login — checking in as an anonymous, untracked visitor would
// make the crowd-status signal too easy to spam.
facilitiesRouter.post("/facilities/:id/checkins", requireAuth, (req, res) => {
  const { overall, aspects, comment } = req.body;

  if (!["functional", "dirty", "broken"].includes(overall)) {
    return res.status(400).json({ error: "overall must be functional, dirty, or broken" });
  }

  const result = mutateStore((store) => {
    const facility = store.facilities.find((f) => f.id === req.params.id);
    if (!facility) return null;

    const checkin = {
      id: `chk_${Date.now()}`,
      facilityId: facility.id,
      overall,
      aspects: aspects || {},
      comment: comment || "",
      timestamp: new Date().toISOString(),
      reportedBy: req.user.id,
    };
    store.checkins.push(checkin);
    return { facility, checkin };
  });

  if (!result) return res.status(404).json({ error: "Facility not found" });

  const { checkins } = readStore();
  res.status(201).json(computeFacilityStatus(result.facility, checkins));
});

// GET /api/flagged
// Facilities where crowd reports disagree with a stale official
// record, ranked by priority. This is the admin dashboard's data.
// Municipal-only — this is internal repair-prioritization data.
facilitiesRouter.get("/flagged", requireAuth, requireRole("municipal"), (req, res) => {
  const { facilities, checkins } = readStore();
  const withStatus = facilities.map((f) => computeFacilityStatus(f, checkins));
  res.json(rankFlagged(withStatus));
});

// POST /api/facilities/:id/official-update
// Lets a "municipal" user log that they've addressed a facility —
// updates the official record, which clears the discrepancy.
// body: { status: "operational"|"under_maintenance" }
// Municipal-only, and now records who made the update.
facilitiesRouter.post(
  "/facilities/:id/official-update",
  requireAuth,
  requireRole("municipal"),
  (req, res) => {
    const { status } = req.body;
    if (!["operational", "under_maintenance"].includes(status)) {
      return res.status(400).json({ error: "status must be operational or under_maintenance" });
    }

    const result = mutateStore((store) => {
      const facility = store.facilities.find((f) => f.id === req.params.id);
      if (!facility) return null;
      facility.officialStatus = status;
      facility.officialLastUpdated = new Date().toISOString();
      facility.lastUpdatedBy = req.user.id;
      return facility;
    });

    if (!result) return res.status(404).json({ error: "Facility not found" });

    const { checkins } = readStore();
    res.json(computeFacilityStatus(result, checkins));
  }
);
