// api.js
// Thin fetch wrapper around the backend. Kept in one place so
// components never construct URLs or handle JSON parsing themselves.

const BASE = "/api";

// api.js is a plain module, not a React component, so it can't use
// useContext directly. AuthContext calls setAuthToken() whenever the
// session changes (login, logout, restore-on-load) and every request
// after that automatically carries the current token.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getFacilities: () => request("/facilities"),
  getFacility: (id) => request(`/facilities/${id}`),
  getFlagged: () => request("/flagged"),
  submitCheckin: (id, payload) =>
    request(`/facilities/${id}/checkins`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logOfficialUpdate: (id, status) =>
    request(`/facilities/${id}/official-update`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => request("/auth/me"),
};
