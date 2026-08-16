// seed.js
// Populates data/store.json with mock facilities around Bhubaneswar
// and a realistic mix of checkins — some clean, some flagged — so
// the demo has a real story to tell without waiting on live users.
//
// Run with: npm run seed

import { readStore, writeStore } from "./db.js";

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const facilities = [
  {
    id: "fac_01",
    name: "Master Canteen Square Public Toilet",
    type: "street",
    lat: 20.2716,
    lng: 85.8404,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(19), // stale + crowd complaints => flagged
  },
  {
    id: "fac_02",
    name: "Bhubaneswar Railway Station – Platform 1",
    type: "transit",
    lat: 20.2679,
    lng: 85.8412,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(2), // recently checked, matches crowd
  },
  {
    id: "fac_03",
    name: "Baramunda Bus Stand Toilet Block",
    type: "transit",
    lat: 20.2961,
    lng: 85.7963,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(24), // stale + crowd complaints => flagged
  },
  {
    id: "fac_04",
    name: "Ekamra Park Public Convenience",
    type: "park",
    lat: 20.2551,
    lng: 85.8330,
    officialStatus: "under_maintenance",
    officialLastUpdated: daysAgo(1), // official already knows, not a discrepancy
  },
  {
    id: "fac_05",
    name: "Unit 1 Market Complex Toilet",
    type: "market",
    lat: 20.2691,
    lng: 85.8385,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(12), // stale + crowd complaints => flagged
  },
  {
    id: "fac_06",
    name: "Kalinga Stadium Public Facility",
    type: "sports",
    lat: 20.2860,
    lng: 85.8188,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(3),
  },
  {
    id: "fac_07",
    name: "Patia Square Toilet Block",
    type: "street",
    lat: 20.3560,
    lng: 85.8189,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(30), // very stale + complaints => high priority
  },
  {
    id: "fac_08",
    name: "IIIT Bhubaneswar Gate Public Toilet",
    type: "institutional",
    lat: 20.3006,
    lng: 85.7749,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(5),
  },
  {
    id: "fac_09",
    name: "Rajmahal Square Toilet",
    type: "street",
    lat: 20.2687,
    lng: 85.8382,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(0), // no checkins yet -> unknown status
  },
  {
    id: "fac_10",
    name: "Capital Hospital Visitor Toilet",
    type: "hospital",
    lat: 20.2734,
    lng: 85.8355,
    officialStatus: "operational",
    officialLastUpdated: daysAgo(8), // stale + complaints => flagged
  },
];

// overall: "functional" | "dirty" | "broken"
const checkins = [
  // fac_01 — repeated broken reports, official thinks it's fine (flagged)
  { facilityId: "fac_01", overall: "broken", aspects: { water: false, lighting: true, lock: false }, comment: "Door lock broken, no water since days.", timestamp: daysAgo(6) },
  { facilityId: "fac_01", overall: "broken", aspects: { water: false, lighting: true, lock: false }, comment: "Still broken.", timestamp: daysAgo(3) },
  { facilityId: "fac_01", overall: "dirty", aspects: { water: true, lighting: true, lock: false }, comment: "Water back but very unclean.", timestamp: daysAgo(1) },

  // fac_02 — dirty but official already flagged under maintenance recently, matches
  { facilityId: "fac_02", overall: "functional", aspects: { water: true, lighting: true, lock: true }, comment: "Clean today.", timestamp: daysAgo(1) },
  { facilityId: "fac_02", overall: "functional", aspects: { water: true, lighting: true, lock: true }, comment: "", timestamp: daysAgo(4) },

  // fac_03 — broken, stale official record (flagged)
  { facilityId: "fac_03", overall: "broken", aspects: { water: false, lighting: false, lock: true }, comment: "No lights at night, unsafe.", timestamp: daysAgo(9) },
  { facilityId: "fac_03", overall: "broken", aspects: { water: false, lighting: false, lock: true }, comment: "Same issue.", timestamp: daysAgo(5) },
  { facilityId: "fac_03", overall: "dirty", aspects: { water: true, lighting: false, lock: true }, comment: "", timestamp: daysAgo(2) },

  // fac_04 — dirty but official already under_maintenance and recent, not a discrepancy
  { facilityId: "fac_04", overall: "dirty", aspects: { water: true, lighting: true, lock: true }, comment: "Renovation in progress, understandable.", timestamp: daysAgo(1) },

  // fac_05 — dirty repeatedly, official stale (flagged)
  { facilityId: "fac_05", overall: "dirty", aspects: { water: true, lighting: true, lock: true }, comment: "Needs cleaning, smells bad.", timestamp: daysAgo(7) },
  { facilityId: "fac_05", overall: "dirty", aspects: { water: true, lighting: true, lock: true }, comment: "", timestamp: daysAgo(4) },
  { facilityId: "fac_05", overall: "broken", aspects: { water: false, lighting: true, lock: true }, comment: "No water now too.", timestamp: daysAgo(1) },

  // fac_06 — clean, functional, matches official
  { facilityId: "fac_06", overall: "functional", aspects: { water: true, lighting: true, lock: true }, comment: "Well maintained.", timestamp: daysAgo(2) },

  // fac_07 — long-neglected, high priority
  { facilityId: "fac_07", overall: "broken", aspects: { water: false, lighting: false, lock: false }, comment: "Completely unusable for weeks.", timestamp: daysAgo(15) },
  { facilityId: "fac_07", overall: "broken", aspects: { water: false, lighting: false, lock: false }, comment: "Still nothing done.", timestamp: daysAgo(8) },
  { facilityId: "fac_07", overall: "broken", aspects: { water: false, lighting: false, lock: false }, comment: "Locked shut, unusable.", timestamp: daysAgo(2) },

  // fac_08 — mostly fine, one dirty report, not enough to flag
  { facilityId: "fac_08", overall: "functional", aspects: { water: true, lighting: true, lock: true }, comment: "", timestamp: daysAgo(3) },
  { facilityId: "fac_08", overall: "dirty", aspects: { water: true, lighting: true, lock: true }, comment: "Could be cleaner.", timestamp: daysAgo(1) },

  // fac_09 — no checkins at all, status unknown

  // fac_10 — broken, stale official (flagged)
  { facilityId: "fac_10", overall: "broken", aspects: { water: false, lighting: true, lock: true }, comment: "Tap broken since last week.", timestamp: daysAgo(5) },
  { facilityId: "fac_10", overall: "dirty", aspects: { water: false, lighting: true, lock: true }, comment: "", timestamp: daysAgo(2) },
];

// Re-seeding resets the demo facilities/checkins, but preserves any real
// accounts people have signed up with — otherwise every re-seed during
// dev would lock testers out of the accounts they just created.
const existing = readStore();

const store = {
  facilities,
  checkins: checkins.map((c, i) => ({ id: `chk_${String(i + 1).padStart(3, "0")}`, ...c })),
  users: existing.users || [],
};

writeStore(store);
console.log(
  `Seeded ${facilities.length} facilities and ${store.checkins.length} checkins ` +
    `(preserved ${store.users.length} existing user account(s)).`
);
