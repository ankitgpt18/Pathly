"use client";

import { useState, useEffect, useCallback } from "react";

interface LocationData {
  lat: number;
  lon: number;
  city: string | null;
  state: string | null;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = "pathly-location";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedLocation {
  lat: number;
  lon: number;
  city: string | null;
  state: string | null;
  timestamp: number;
}

function getCached(): CachedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedLocation = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(data: CachedLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    lat: 0,
    lon: 0,
    city: null,
    state: null,
    loading: true,
    error: null,
  });

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        { headers: { "User-Agent": "Pathly/1.0" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || null;
      const state = addr.state || null;
      return { city, state };
    } catch {
      return { city: null, state: null };
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    const cached = getCached();
    if (cached) {
      setLocation({
        lat: cached.lat,
        lon: cached.lon,
        city: cached.city,
        state: cached.state,
        loading: false,
        error: null,
      });
      return;
    }

    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { city, state } = await reverseGeocode(latitude, longitude);

        const locData = {
          lat: latitude,
          lon: longitude,
          city,
          state,
          timestamp: Date.now(),
        };
        setCache(locData);

        setLocation({
          lat: latitude,
          lon: longitude,
          city,
          state,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Location access denied",
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...location, refresh: fetchLocation };
}
