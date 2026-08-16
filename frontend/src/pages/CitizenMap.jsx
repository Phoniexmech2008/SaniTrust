import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useGeolocation } from "../hooks/useGeolocation.js";
import { distanceKm } from "../utils/geo.js";
import LeafletMap from "../components/LeafletMap.jsx";
import FacilityPanel from "../components/FacilityPanel.jsx";
import RadiusControl from "../components/RadiusControl.jsx";
import "./CitizenMap.css";

const DEFAULT_RADIUS_KM = 3;

export default function CitizenMap() {
  const [facilities, setFacilities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  // The user's location can come from either the browser's geolocation
  // API or a manual tap on the map — both end up here in the same
  // {lat, lng} shape, so the rest of the page doesn't need to know
  // which source it came from.
  const [location, setLocation] = useState(null);
  const [manualPickMode, setManualPickMode] = useState(false);

  const {
    position: geoPosition,
    loading: locating,
    error: locationError,
    request: requestLocation,
  } = useGeolocation();

  // Whenever the browser successfully resolves a geolocation position,
  // adopt it as the current location (this also covers the "Toilets
  // near me" button being clicked again after a manual pick).
  useEffect(() => {
    if (geoPosition) setLocation(geoPosition);
  }, [geoPosition]);

  function handleManualPick(point) {
    setLocation(point);
    setManualPickMode(false);
  }

  async function load() {
    const data = await api.getFacilities();
    setFacilities(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Attach a distanceKm to every facility once we know where the user
  // is — kept separate from the raw API data so "near me" is purely a
  // view concern, not something the backend needs to know about.
  const facilitiesWithDistance = useMemo(() => {
    if (!location) return facilities;
    return facilities.map((f) => ({
      ...f,
      distanceKm: distanceKm(location.lat, location.lng, f.lat, f.lng),
    }));
  }, [facilities, location]);

  const visibleFacilities = useMemo(() => {
    if (!location) return facilitiesWithDistance;
    return facilitiesWithDistance.filter((f) => f.distanceKm <= radiusKm);
  }, [facilitiesWithDistance, location, radiusKm]);

  return (
    <div className="citizen-map">
      <div className="citizen-map__stage">
        {loading ? (
          <p className="citizen-map__loading">Loading facilities…</p>
        ) : (
          <LeafletMap
            facilities={visibleFacilities}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userLocation={location}
            radiusKm={radiusKm}
            manualPickMode={manualPickMode}
            onManualPick={handleManualPick}
          />
        )}

        <RadiusControl
          active={!!location}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onEnable={requestLocation}
          manualPickMode={manualPickMode}
          onStartManualPick={() => setManualPickMode(true)}
          onCancelManualPick={() => setManualPickMode(false)}
          loading={locating}
          error={locationError}
          matchCount={visibleFacilities.length}
        />

        <div className="citizen-map__legend">
          <span><i className="citizen-map__dot" style={{ background: "#1b7a6e" }} />Functional</span>
          <span><i className="citizen-map__dot" style={{ background: "#c98a1f" }} />Needs cleaning</span>
          <span><i className="citizen-map__dot" style={{ background: "#b13c2e" }} />Broken</span>
          <span><i className="citizen-map__dot" style={{ background: "#8a8578" }} />Unreported</span>
        </div>
      </div>
      {selectedId && (
        <FacilityPanel
          facilityId={selectedId}
          onClose={() => setSelectedId(null)}
          distanceKm={visibleFacilities.find((f) => f.id === selectedId)?.distanceKm}
        />
      )}
    </div>
  );
}
