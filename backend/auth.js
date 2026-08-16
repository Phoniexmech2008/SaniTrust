// auth.js
// Password hashing and session tokens, hand-rolled from Node's built-in
// crypto module rather than pulling in bcrypt/jsonwebtoken. Same reasoning
// as db.js being a plain JSON file: fewer black-box dependencies, and it's
// something you can actually walk a judge through line by line.
//
// Password storage: scrypt with a random salt per user (scrypt is built
// into Node, memory-hard, and doesn't need a native module like bcrypt).
// Session tokens: base64url(payload) + "." + HMAC-SHA256 signature, signed
// with a server-side secret. No external JWT library, but the same shape —
// a signed, tamper-evident, stateless token.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

const SCRYPT_KEYLEN = 64;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// In a real deployment this comes from an env var. For a hackathon demo
// process, a per-boot random secret is fine — it just means sessions don't
// survive a server restart, which is an acceptable tradeoff here.
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, stored) {
  const [salt, derivedKeyHex] = stored.split(":");
  if (!salt || !derivedKeyHex) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(derivedKeyHex, "hex");
  // Lengths must match before timingSafeEqual, otherwise it throws.
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64) {
  return createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
}

// Token = base64url(JSON payload) + "." + HMAC signature of that string.
export function createToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

// Returns the decoded payload if the token is well-formed, correctly
// signed, and not expired — otherwise null. Never throws.
export function verifyToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = sign(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

// Express middleware: requires a valid bearer token, attaches req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) return res.status(401).json({ error: "Not authenticated" });

  req.user = { id: payload.sub, role: payload.role };
  next();
}

// Express middleware factory: requires requireAuth to have already run,
// and additionally requires the user's role to be in the allowed list.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized for this action" });
    }
    next();
  };
}
