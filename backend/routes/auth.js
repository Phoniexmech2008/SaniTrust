// routes/auth.js
// The actual HTTP endpoints for signup/login/session-check. auth.js
// (one level up) holds the crypto — hashing, tokens, middleware — this
// file just validates input and talks to the store.

import { Router } from "express";
import { readStore, mutateStore } from "../db.js";
import { hashPassword, verifyPassword, createToken, requireAuth } from "../auth.js";

export const authRouter = Router();

const VALID_ROLES = ["citizen", "municipal"];

// Never send passwordHash to the client, ever — not even to the user
// it belongs to. Strip it at the boundary, once, here.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
// body: { name, email, password, role }
authRouter.post("/signup", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Role must be citizen or municipal" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = mutateStore((store) => {
    const existing = store.users.find((u) => u.email === normalizedEmail);
    if (existing) return { error: "An account with this email already exists" };

    const user = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return { user };
  });

  if (result.error) return res.status(409).json({ error: result.error });

  const token = createToken(result.user);
  res.status(201).json({ token, user: toPublicUser(result.user) });
});

// POST /api/auth/login
// body: { email, password }
authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { users } = readStore();
  const user = users.find((u) => u.email === normalizedEmail);

  // Same error for "no such user" and "wrong password" — don't leak
  // which emails are registered.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createToken(user);
  res.json({ token, user: toPublicUser(user) });
});

// GET /api/auth/me
// Returns the current user for a valid bearer token — used on app
// load to restore a session from a stored token.
authRouter.get("/me", requireAuth, (req, res) => {
  const { users } = readStore();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: toPublicUser(user) });
});
