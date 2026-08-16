import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken } from "../api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "sanitrust_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // "loading" covers the brief window where we're checking a persisted
  // token against the backend before we know whether there's a session.
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((newToken) => {
    setToken(newToken);
    setAuthToken(newToken);
    if (newToken) {
      localStorage.setItem(STORAGE_KEY, newToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // On first load, restore a persisted session by checking the token
  // against the backend rather than trusting whatever's in storage.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    applyToken(stored);
    api
      .getMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        // Token expired, was tampered with, or the server restarted
        // (per-boot session secret) — clear it and fall back to logged out.
        applyToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [applyToken]);

  async function login(email, password) {
    const { token: newToken, user: loggedInUser } = await api.login({ email, password });
    applyToken(newToken);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function signup({ name, email, password, role }) {
    const { token: newToken, user: newUser } = await api.signup({ name, email, password, role });
    applyToken(newToken);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    applyToken(null);
    setUser(null);
  }

  const value = { user, token, loading, login, signup, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
