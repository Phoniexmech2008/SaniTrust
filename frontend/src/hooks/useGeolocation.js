// useGeolocation.js
// Wraps the browser Geolocation API in the state shape components
// actually need: a position (or null), a loading flag, and an error
// message they can show instead of silently failing.

import { useState, useCallback } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        // err.code: 1 = permission denied, 2 = unavailable, 3 = timeout
        const message =
          err.code === 1
            ? "Location access denied. Enable it in your browser settings to use \u2018Near Me\u2019."
            : "Couldn't get your location. Try again.";
        setError(message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { position, loading, error, request };
}
