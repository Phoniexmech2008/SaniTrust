import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  async function load() {
    setLoading(true);
    const data = await api.getFlagged();
    setFlagged(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(id) {
    setActingOn(id);
    await api.logOfficialUpdate(id, "under_maintenance");
    await load();
    setActingOn(null);
  }

  return (
    <div className="admin-dash">
      <div className="admin-dash__header">
        <div>
          <h2 className="admin-dash__title">Priority Repair Queue</h2>
          <p className="admin-dash__subtitle">
            Facilities where citizen reports contradict the official maintenance record.
            Ranked by severity and how long the record has gone unupdated.
          </p>
        </div>
        <span className="admin-dash__count tag">{flagged.length} flagged</span>
      </div>

      {loading && <p className="admin-dash__empty">Loading…</p>}

      {!loading && flagged.length === 0 && (
        <p className="admin-dash__empty">
          Nothing flagged right now — official records match citizen reports.
        </p>
      )}

      {!loading && flagged.length > 0 && (
        <table className="admin-dash__table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Crowd status</th>
              <th>Official record</th>
              <th>Record age</th>
              <th>Reports</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flagged.map((f) => (
              <tr key={f.id}>
                <td>
                  <span className="tag admin-dash__id">{f.id}</span>
                  <div>{f.name}</div>
                </td>
                <td>
                  <StatusBadge status={f.crowdStatus} />
                </td>
                <td className="admin-dash__official">{f.officialStatus.replace("_", " ")}</td>
                <td>{f.officialAgeDays}d</td>
                <td>{f.reportCount}</td>
                <td>
                  <span className="admin-dash__priority">{f.priorityScore}</span>
                </td>
                <td>
                  <button
                    className="admin-dash__resolve"
                    onClick={() => handleResolve(f.id)}
                    disabled={actingOn === f.id}
                  >
                    {actingOn === f.id ? "Logging…" : "Mark as being addressed"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
