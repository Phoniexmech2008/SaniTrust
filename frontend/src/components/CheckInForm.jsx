import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./CheckInForm.css";

const OVERALL_OPTIONS = [
  { value: "functional", label: "Functional" },
  { value: "dirty", label: "Needs Cleaning" },
  { value: "broken", label: "Broken" },
];

export default function CheckInForm({ facilityId, onSubmitted }) {
  const { isAuthenticated } = useAuth();
  const [overall, setOverall] = useState("functional");
  const [aspects, setAspects] = useState({ water: true, lighting: true, lock: true });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleAspect = (key) =>
    setAspects((prev) => ({ ...prev, [key]: !prev[key] }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.submitCheckin(facilityId, { overall, aspects, comment });
      onSubmitted(updated);
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="checkin-form checkin-form--locked">
        <p className="checkin-form__label tag">Report current condition</p>
        <p className="checkin-form__locked-text">
          Sign in to submit a check-in — it keeps reports accountable.
        </p>
        <Link className="checkin-form__submit checkin-form__signin-link" to="/login">
          Sign in to report
        </Link>
      </div>
    );
  }

  return (
    <form className="checkin-form" onSubmit={handleSubmit}>
      <p className="checkin-form__label tag">Report current condition</p>

      <div className="checkin-form__overall">
        {OVERALL_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`checkin-form__pill ${overall === opt.value ? "is-selected" : ""}`}
          >
            <input
              type="radio"
              name="overall"
              value={opt.value}
              checked={overall === opt.value}
              onChange={() => setOverall(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="checkin-form__aspects">
        <label>
          <input
            type="checkbox"
            checked={aspects.water}
            onChange={() => toggleAspect("water")}
          />
          Water available
        </label>
        <label>
          <input
            type="checkbox"
            checked={aspects.lighting}
            onChange={() => toggleAspect("lighting")}
          />
          Lighting working
        </label>
        <label>
          <input
            type="checkbox"
            checked={aspects.lock}
            onChange={() => toggleAspect("lock")}
          />
          Door/lock working
        </label>
      </div>

      <textarea
        className="checkin-form__comment"
        placeholder="Optional comment — what did you notice?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      {error && <p className="checkin-form__error">{error}</p>}

      <button className="checkin-form__submit" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Report"}
      </button>
    </form>
  );
}
