import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
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

export default function LeafletMap({ facilities, selectedId, onSelect }) {
  const center = [20.2961, 85.8245]; // Bhubaneswar
  const selected = facilities.find((f) => f.id === selectedId);

  return (
    <MapContainer center={center} zoom={12} className="leaflet-map">
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
          </Tooltip>
        </Marker>
      ))}
      <FlyToSelected facility={selected} />
    </MapContainer>
  );
}
