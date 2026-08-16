import { MapContainer, TileLayer, Marker, Tooltip, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "./LeafletMap.css";

const TONE_COLOR = {
  functional: "#1b7a6e",
  dirty: "#c98a1f",
  broken: "#b13c2e",
  unknown: "#8a8578",
};

// Markers as plain divs, not image pins — cheap, crisp at any zoom,
// and the color does all the signaling work a legend would otherwise do.
function markerIcon(status, isSelected) {
  const color = TONE_COLOR[status] || TONE_COLOR.unknown;
  const size = isSelected ? 22 : 16;
  return L.divIcon({
    className: "facility-marker",
    html: `<span style="
      display:block;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid #f4f1ea;
      box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// A distinct pulsing-dot style for "you are here" — deliberately not
// just another status color, so it can't be mistaken for a facility.
function userLocationIcon() {
  return L.divIcon({
    className: "user-location-marker",
    html: `<span class="user-location-marker__dot"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Recenters the map when the selected facility changes, without
// forcing a full remount of the map container.
function FlyToSelected({ facility }) {
  const map = useMap();
  useEffect(() => {
    if (facility) {
      map.flyTo([facility.lat, facility.lng], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [facility, map]);
  return null;
}

// Recenters on the user's location the moment it's acquired, and
// zooms in enough that a small-radius search is actually legible.
function FlyToUser({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.8 });
    }
  }, [userLocation, map]);
  return null;
}

// When manual-pick mode is on, clicking anywhere on the map reports
// that lat/lng back up as the user's location — the fallback for when
// browser geolocation is denied, unavailable, or just not trusted.
function ManualLocationPicker({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (active) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LeafletMap({
  facilities,
  selectedId,
  onSelect,
  userLocation,
  radiusKm,
  manualPickMode,
  onManualPick,
}) {
  const center = [20.2961, 85.8245]; // Bhubaneswar
  const selected = facilities.find((f) => f.id === selectedId);

  return (
    <MapContainer
      center={center}
      zoom={12}
      className={`leaflet-map ${manualPickMode ? "leaflet-map--picking" : ""}`}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {facilities.map((f) => (
        <Marker
          key={f.id}
          position={[f.lat, f.lng]}
          icon={markerIcon(f.crowdStatus, f.id === selectedId)}
          eventHandlers={{ click: () => onSelect(f.id) }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            {f.name}
            {typeof f.distanceKm === "number" && (
              <> &middot; {f.distanceKm.toFixed(1)} km</>
            )}
          </Tooltip>
        </Marker>
      ))}

      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon()}>
            <Tooltip direction="top" offset={[0, -8]}>You are here</Tooltip>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#10233a",
              weight: 1,
              fillColor: "#10233a",
              fillOpacity: 0.05,
            }}
          />
        </>
      )}

      <FlyToSelected facility={selected} />
      <FlyToUser userLocation={userLocation} />
      <ManualLocationPicker active={manualPickMode} onPick={onManualPick} />
    </MapContainer>
  );
}
