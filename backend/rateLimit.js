// rateLimit.js
// Anti-spam for check-ins, computed directly from the existing checkin
// history rather than a separate in-memory tracker — the store already
// has everything needed, and this way the limit survives a server
// restart instead of resetting (which an in-memory Map would do).
//
// Two rules:
//   1. Per-facility cooldown — the same user can't re-report the same
//      facility more than once every 10 minutes. This is the one that
//      actually protects the crowd-status signal, since that's computed
//      per facility.
//   2. Global hourly cap — the same user can't submit more than 5
//      check-ins (across any facilities) per rolling hour. Catches
//      someone spamming many different facilities instead of one.

const FACILITY_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const GLOBAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const GLOBAL_MAX_CHECKINS = 5;

function minutesCeil(ms) {
  return Math.ceil(ms / 60000);
}

// Pure function: given the full checkin list, a user, a target facility,
// and "now" (injectable for testing), returns whether a new checkin is
// allowed and why not if it isn't.
export function checkRateLimit(allCheckins, userId, facilityId, now = Date.now()) {
  const userCheckins = allCheckins.filter((c) => c.reportedBy === userId);

  const recentOnThisFacility = userCheckins.filter(
    (c) =>
      c.facilityId === facilityId &&
      now - new Date(c.timestamp).getTime() < FACILITY_COOLDOWN_MS
  );
  if (recentOnThisFacility.length > 0) {
    const mostRecent = recentOnThisFacility.reduce((a, b) =>
      new Date(a.timestamp) > new Date(b.timestamp) ? a : b
    );
    const retryAfterMs =
      FACILITY_COOLDOWN_MS - (now - new Date(mostRecent.timestamp).getTime());
    return {
      allowed: false,
      reason: `You already checked in on this facility recently. Try again in ${minutesCeil(
        retryAfterMs
      )} minute(s).`,
      retryAfterMs,
    };
  }

  const recentGlobal = userCheckins.filter(
    (c) => now - new Date(c.timestamp).getTime() < GLOBAL_WINDOW_MS
  );
  if (recentGlobal.length >= GLOBAL_MAX_CHECKINS) {
    const oldestOfWindow = recentGlobal.reduce((a, b) =>
      new Date(a.timestamp) < new Date(b.timestamp) ? a : b
    );
    const retryAfterMs =
      GLOBAL_WINDOW_MS - (now - new Date(oldestOfWindow.timestamp).getTime());
    return {
      allowed: false,
      reason: `You've submitted ${GLOBAL_MAX_CHECKINS} check-ins in the last hour. Try again in ${minutesCeil(
        retryAfterMs
      )} minute(s).`,
      retryAfterMs,
    };
  }

  return { allowed: true };
}
