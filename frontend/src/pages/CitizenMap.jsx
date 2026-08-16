import { useEffect, useState } from "react";
import { api } from "../api.js";
import LeafletMap from "../components/LeafletMap.jsx";
import FacilityPanel from "../components/FacilityPanel.jsx";
import "./CitizenMap.css";

export default function CitizenMap() {
  const [facilities, setFacilities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.getFacilities();
    setFacilities(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="citizen-map">
      <div className="citizen-map__stage">
        {loading ? (
          <p className="citizen-map__loading">Loading facilities…</p>
        ) : (
          <LeafletMap facilities={facilities} selectedId={selectedId} onSelect={setSelectedId} />
        )}
        <div className="citizen-map__legend">
          <span><i className="citizen-map__dot" style={{ background: "#1b7a6e" }} />Functional</span>
          <span><i className="citizen-map__dot" style={{ background: "#c98a1f" }} />Needs cleaning</span>
          <span><i className="citizen-map__dot" style={{ background: "#b13c2e" }} />Broken</span>
          <span><i className="citizen-map__dot" style={{ background: "#8a8578" }} />Unreported</span>
        </div>
      </div>
      {selectedId && (
        <FacilityPanel facilityId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
