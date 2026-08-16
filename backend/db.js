// db.js
// A deliberately small, dependency-free JSON-file store.
// For a hackathon this is more reliable than a real database engine —
// no drivers, no native builds, no connection strings. It just needs
// a writable folder. If we ever outgrow it, the read()/write() shape
// below maps cleanly onto a real DB call.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "data", "store.json");

function ensureStoreExists() {
  if (!existsSync(STORE_PATH)) {
    writeFileSync(
      STORE_PATH,
      JSON.stringify({ facilities: [], checkins: [], users: [] }, null, 2)
    );
  }
}

export function readStore() {
  ensureStoreExists();
  const raw = readFileSync(STORE_PATH, "utf-8");
  const store = JSON.parse(raw);
  // Backfill for stores created before the users table existed.
  if (!store.users) store.users = [];
  return store;
}

export function writeStore(store) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// Small helper so route handlers don't each re-implement
// "read, mutate, write" and risk clobbering concurrent writes.
export function mutateStore(mutatorFn) {
  const store = readStore();
  const result = mutatorFn(store);
  writeStore(store);
  return result;
}
