"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, MapPin } from "lucide-react";

interface RouteMapProps {
  geometry?: number[][]; // [lon, lat] pairs from OSRM GeoJSON
  origin?: { lat: number; lon: number };
  destination?: { lat: number; lon: number };
  nearbyStops?: Array<{ name: string; lat: number; lon: number; type: string; distance_m: number }>;
}

export default function RouteMap({ geometry, origin, destination, nearbyStops }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  // Dynamic import of Leaflet (SSR safe)
  useEffect(() => {
    let mounted = true;
    import("leaflet").then((leaflet) => {
      if (mounted) {
        setL(leaflet.default || leaflet);
        setLoaded(true);
      }
    }).catch(() => {
      // Leaflet not installed — silently skip
      console.warn("[Pathly] Leaflet not installed. Run: npm install leaflet");
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !L || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Inject Leaflet CSS if not already present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Determine center and bounds
    let center: [number, number] = [28.6139, 77.209]; // Delhi default
    let zoom = 13;

    if (origin && destination) {
      center = [
        (origin.lat + destination.lat) / 2,
        (origin.lon + destination.lon) / 2,
      ];
    } else if (nearbyStops && nearbyStops.length > 0) {
      center = [nearbyStops[0].lat, nearbyStops[0].lon];
    }

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: expanded,
      dragging: expanded,
      doubleClickZoom: expanded,
      touchZoom: expanded,
    });

    // Use CartoDB Voyager tiles — beautiful, free, no key
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icons using divIcon (no image dependencies)
    const originIcon = L.divIcon({
      className: "pathly-marker pathly-marker-origin",
      html: `<div class="marker-dot origin-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const destIcon = L.divIcon({
      className: "pathly-marker pathly-marker-dest",
      html: `<div class="marker-dot dest-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const stopIcon = L.divIcon({
      className: "pathly-marker pathly-marker-stop",
      html: `<div class="marker-dot stop-dot"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    // Route polyline
    if (geometry && geometry.length > 1) {
      const latlngs: [number, number][] = geometry.map(([lon, lat]) => [lat, lon]);
      const polyline = L.polyline(latlngs, {
        color: "var(--th-accent-purple)",
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1.5,
        className: "route-polyline",
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    // Origin marker
    if (origin) {
      L.marker([origin.lat, origin.lon], { icon: originIcon })
        .bindPopup("Start", { className: "pathly-popup" })
        .addTo(map);
    }

    // Destination marker
    if (destination) {
      L.marker([destination.lat, destination.lon], { icon: destIcon })
        .bindPopup("Destination", { className: "pathly-popup" })
        .addTo(map);
    }

    // Nearby stops
    if (nearbyStops) {
      const bounds: [number, number][] = [];
      nearbyStops.forEach((stop) => {
        bounds.push([stop.lat, stop.lon]);
        L.marker([stop.lat, stop.lon], { icon: stopIcon })
          .bindPopup(
            `<strong>${stop.name}</strong><br/>${stop.distance_m}m · ${stop.type}`,
            { className: "pathly-popup" }
          )
          .addTo(map);
      });
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    mapInstanceRef.current = map;

    // Resize observer for container changes
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loaded, L, geometry, origin, destination, nearbyStops, expanded]);

  // Update interaction states when expanded changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (expanded) {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
    }
  }, [expanded]);

  if (!loaded) {
    return (
      <div className="route-map-container collapsed">
        <div className="flex items-center justify-center h-full gap-2" style={{ color: "var(--th-text-faint)" }}>
          <MapPin size={14} />
          <span className="text-[12px]">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`route-map-container ${expanded ? "expanded" : "collapsed"}`}>
      <div ref={mapRef} className="route-map-inner" />
      <button
        className="map-expand-btn"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse map" : "Expand map"}
      >
        {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}

// Type stub for leaflet to avoid TS errors when leaflet isn't installed
declare module "leaflet" {
  const L: any;
  export = L;
}
