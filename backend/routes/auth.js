// routes/auth.js
// Signup, login, and "who am I" session check. Keeps the actual hashing
// and token logic in auth.js — these handlers just wire HTTP to it.

import { Router } from "express";
import { readStore, mutateStore } from "../db.js";
import { hashPassword, verifyPassword, createToken, requireAuth } from "../auth.js";

export const authRouter = Router();

const VALID_ROLES = ["citizen", "municipal"];

function publicUser(user) {
  // Never send passwordHash back to the client.
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/signup
// body: { name, email, password, role: "citizen" | "municipal" }
authRouter.post("/signup", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "role must be citizen or municipal" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = mutateStore((store) => {
    const exists = store.users.some((u) => u.email === normalizedEmail);
    if (exists) return { conflict: true };

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

  if (result.conflict) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const token = createToken(result.user);
  res.status(201).json({ token, user: publicUser(result.user) });
});

// POST /api/auth/login
// body: { email, password }
authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { users } = readStore();
  const user = users.find((u) => u.email === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
// Returns the current user for a valid session token — lets the frontend
// restore a session on page load without re-sending credentials.
authRouter.get("/me", requireAuth, (req, res) => {
  const { users } = readStore();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: publicUser(user) });
});
