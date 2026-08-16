import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./LoginPage.css";

const ROLES = [
  { value: "citizen", label: "Citizen", blurb: "Check in on facilities you visit" },
  { value: "municipal", label: "Municipal Staff", blurb: "Manage the repair queue" },
];

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedInUser =
        mode === "login"
          ? await login(email, password)
          : await signup({ name, email, password, role });

      // Send municipal staff straight to their dashboard on first login,
      // citizens back to wherever they were headed (default: the map).
      navigate(loggedInUser.role === "municipal" && redirectTo === "/" ? "/admin" : redirectTo, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <p className="tag login-page__eyebrow">
          {mode === "login" ? "Sign in" : "Create account"}
        </p>
        <h2 className="login-page__title">
          {mode === "login" ? "Welcome back" : "Join SaniTrust"}
        </h2>
        <p className="login-page__subtitle">
          {mode === "login"
            ? "Sign in to check in on facilities or manage the repair queue."
            : "Citizens report conditions on the ground; municipal staff track and resolve them."}
        </p>

        <form className="login-page__form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="login-page__field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="login-page__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="login-page__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            {mode === "signup" && (
              <span className="login-page__hint">At least 8 characters</span>
            )}
          </label>

          {mode === "signup" && (
            <div className="login-page__roles">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`login-page__role ${role === r.value ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  <span className="login-page__role-label">{r.label}</span>
                  <span className="login-page__role-blurb">{r.blurb}</span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="login-page__error">{error}</p>}

          <button className="login-page__submit" type="submit" disabled={submitting}>
            {submitting
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="login-page__switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
