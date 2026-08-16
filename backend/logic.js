// logic.js
// Turns raw checkins + the official maintenance record into the
// numbers the frontend actually needs: a crowd-perceived status,
// a discrepancy flag, and a priority score for the admin dashboard.

const RECENT_WINDOW = 5; // how many recent checkins we weigh
const STALE_OFFICIAL_DAYS = 7; // official record older than this = suspicious if crowd disagrees

// A checkin's "overall" field is one of these, worst first.
const SEVERITY = { broken: 3, dirty: 2, functional: 1 };

function daysSince(isoDate) {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Crowd status = majority vote over the most recent N checkins,
// falling back to "unknown" if nobody has reported yet.
export function computeCrowdStatus(checkinsForFacility) {
  if (checkinsForFacility.length === 0) return "unknown";

  const recent = [...checkinsForFacility]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, RECENT_WINDOW);

  const tally = { functional: 0, dirty: 0, broken: 0 };
  for (const c of recent) tally[c.overall] = (tally[c.overall] || 0) + 1;

  // Ties break toward the worse status — for a public-health tool,
  // false alarms are cheaper than missed ones.
  return Object.entries(tally).sort(
    (a, b) => b[1] - a[1] || SEVERITY[b[0]] - SEVERITY[a[0]]
  )[0][0];
}

// The core of the problem statement: does crowd sentiment disagree
// with what the municipality's own record says, and for how long
// has that gap been open?
export function computeFacilityStatus(facility, allCheckins) {
  const checkinsForFacility = allCheckins.filter(
    (c) => c.facilityId === facility.id
  );
  const crowdStatus = computeCrowdStatus(checkinsForFacility);
  const officialAge = daysSince(facility.officialLastUpdated);

  const crowdSaysProblem = crowdStatus === "broken" || crowdStatus === "dirty";
  const officialSaysFine = facility.officialStatus === "operational";
  const officialIsStale = officialAge >= STALE_OFFICIAL_DAYS;

  const discrepancy = crowdSaysProblem && officialSaysFine && officialIsStale;

  // Priority score: worse crowd status + longer official silence +
  // more corroborating reports = higher priority. Simple, explainable
  // math — the kind you can defend to a judge on the spot.
  const severityScore = SEVERITY[crowdStatus] ?? 0;
  const reportCount = checkinsForFacility.filter(
    (c) => c.overall === "broken" || c.overall === "dirty"
  ).length;
  const priorityScore = discrepancy
    ? severityScore * 10 + Math.min(officialAge, 30) + reportCount
    : 0;

  return {
    ...facility,
    crowdStatus,
    officialAgeDays: officialAge,
    discrepancy,
    priorityScore,
    reportCount: checkinsForFacility.length,
  };
}

export function rankFlagged(facilitiesWithStatus) {
  return facilitiesWithStatus
    .filter((f) => f.discrepancy)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
