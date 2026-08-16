import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { compressImage } from "../utils/imageCompress.js";
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
  const [photo, setPhoto] = useState(null); // compressed base64 data URL, or null
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleAspect = (key) =>
    setAspects((prev) => ({ ...prev, [key]: !prev[key] }));

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setPhotoError(null);
    setPhotoProcessing(true);
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoProcessing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.submitCheckin(facilityId, { overall, aspects, comment, photo });
      onSubmitted(updated);
      setComment("");
      setPhoto(null);
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

      <div className="checkin-form__photo">
        {photo ? (
          <div className="checkin-form__photo-preview">
            <img src={photo} alt="Attached evidence preview" />
            <button
              type="button"
              className="checkin-form__photo-remove"
              onClick={() => setPhoto(null)}
            >
              Remove photo
            </button>
          </div>
        ) : (
          <label className="checkin-form__photo-attach">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              disabled={photoProcessing}
            />
            {photoProcessing ? "Processing…" : "📷 Attach a photo (optional)"}
          </label>
        )}
        {photoError && <p className="checkin-form__error">{photoError}</p>}
      </div>

      {error && <p className="checkin-form__error">{error}</p>}

      <button className="checkin-form__submit" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Report"}
      </button>
    </form>
  );
}
