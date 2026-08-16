import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "./StatusBadge.jsx";
import CheckInForm from "./CheckInForm.jsx";
import "./FacilityPanel.css";

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function FacilityPanel({ facilityId, onClose }) {
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await api.getFacility(facilityId);
    setFacility(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [facilityId]);

  if (loading || !facility) {
    return (
      <aside className="facility-panel">
        <p className="facility-panel__loading">Loading facility…</p>
      </aside>
    );
  }

  return (
    <aside className="facility-panel scrollpane">
      <button className="facility-panel__close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <p className="tag facility-panel__id">{facility.id}</p>
      <h2 className="facility-panel__name">{facility.name}</h2>

      <div className="facility-panel__badges">
        <StatusBadge status={facility.crowdStatus} size="lg" />
        {facility.discrepancy && (
          <span className="facility-panel__flag tag">⚠ Flagged — official record unmatched</span>
        )}
      </div>

      <dl className="facility-panel__meta">
        <div>
          <dt>Official record</dt>
          <dd>{facility.officialStatus.replace("_", " ")}</dd>
        </div>
        <div>
          <dt>Last official update</dt>
          <dd>{timeAgo(facility.officialLastUpdated)}</dd>
        </div>
        <div>
          <dt>Citizen reports</dt>
          <dd>{facility.reportCount}</dd>
        </div>
      </dl>

      <CheckInForm facilityId={facility.id} onSubmitted={load} />

      <div className="facility-panel__history">
        <p className="tag facility-panel__history-label">Recent reports</p>
        {facility.history.length === 0 && (
          <p className="facility-panel__empty">No reports yet — be the first.</p>
        )}
        {facility.history.map((h) => (
          <div key={h.id} className="facility-panel__history-item">
            <div className="facility-panel__history-top">
              <StatusBadge status={h.overall} />
              <span className="facility-panel__history-time">{timeAgo(h.timestamp)}</span>
            </div>
            {h.comment && <p className="facility-panel__history-comment">{h.comment}</p>}
          </div>
        ))}
      </div>
    </aside>
  );
}
