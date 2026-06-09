"use client";

import React, { useEffect, useRef } from "react";

interface RouteWaypoint {
  lat: number;
  lng: number;
  label: string;
}

interface LeafletMapProps {
  waypoints: RouteWaypoint[];
  currentStep: number;
  totalSteps: number;
}

export default function LeafletMap({ waypoints, currentStep, totalSteps }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const animRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet — only runs client-side
    import("leaflet").then((L) => {
      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current || mapRef.current) return;

      // Centre on Nigeria
      const map = L.map(containerRef.current, {
        center:        [9.0820, 8.6753],
        zoom:          6,
        zoomControl:   false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        dragging:      true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Tile layer — CartoDB Voyager (clean, no heavy labels)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Small attribution
      L.control.attribution({ prefix: false, position: "bottomright" })
        .addTo(map);
      map.attributionControl.addAttribution("© OpenStreetMap © CARTO");

      if (!waypoints.length) return;

      // Draw dashed route polyline
      const latlngs = waypoints.map(w => [w.lat, w.lng] as [number, number]);
      L.polyline(latlngs, {
        color:     "#b07e3a",
        weight:    3,
        dashArray: "8, 6",
        opacity:   0.85,
      }).addTo(map);

      // Origin marker (dark green pin)
      const originIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#2d4c38;border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      });

      // Destination marker (gold pin)
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#b07e3a;border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      });

      // Animated delivery dot
      const deliveryIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#b07e3a;border:3px solid white;
          box-shadow:0 0 0 6px rgba(176,126,58,0.2),0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="
            font-family:Material Symbols Rounded,sans-serif;
            font-size:10px;color:white;line-height:1;
            font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 20;
          ">local_shipping</span>
        </div>`,
        iconSize:   [20, 20],
        iconAnchor: [10, 10],
      });

      // Place origin + destination markers with tooltips
      L.marker([waypoints[0].lat, waypoints[0].lng], { icon: originIcon })
        .bindTooltip(waypoints[0].label, { permanent: false, direction: "top", className: "nat-tooltip" })
        .addTo(map);

      L.marker([waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng], { icon: destIcon })
        .bindTooltip(waypoints[waypoints.length - 1].label, { permanent: false, direction: "top", className: "nat-tooltip" })
        .addTo(map);

      // Place delivery marker at current interpolated position
      const progress = Math.min(currentStep / Math.max(totalSteps, 1), 1);
      const startPos = interpolateRoute(waypoints, progress);
      const deliveryMarker = L.marker([startPos.lat, startPos.lng], { icon: deliveryIcon, zIndexOffset: 1000 })
        .addTo(map);
      markerRef.current = deliveryMarker;

      // Fit map to route bounds with padding
      map.fitBounds(L.latLngBounds(latlngs).pad(0.15));

      // Animate marker oscillation along route segment (smooth back-and-forth within active segment)
      let tick = 0;
      animRef.current = setInterval(() => {
        tick += 0.005;
        const baseProgress = Math.min(currentStep / Math.max(totalSteps, 1), 1);
        // Oscillate ±4% around the current position so it looks "live"
        const segmentSize = 1 / Math.max(totalSteps, 1);
        const osc = Math.sin(tick * Math.PI * 2) * segmentSize * 0.4;
        const animProgress = Math.max(0, Math.min(1, baseProgress + osc));
        const pos = interpolateRoute(waypoints, animProgress);
        deliveryMarker.setLatLng([pos.lat, pos.lng]);
      }, 50);
    });

    return () => {
      if (animRef.current) clearInterval(animRef.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        .nat-tooltip {
          background: #141f19;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .nat-tooltip::before { display: none; }
        .leaflet-container { font-family: inherit; }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
          border-radius: 4px !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-[#e2dacd]"
        style={{ height: 280 }}
      />
    </>
  );
}

/* ─── Interpolate a position along the waypoint route ───────────── */
function interpolateRoute(waypoints: RouteWaypoint[], progress: number) {
  if (waypoints.length === 1) return waypoints[0];
  const totalSegments = waypoints.length - 1;
  const scaled        = progress * totalSegments;
  const segIdx        = Math.min(Math.floor(scaled), totalSegments - 1);
  const segT          = scaled - segIdx;
  const p1 = waypoints[segIdx];
  const p2 = waypoints[segIdx + 1] ?? waypoints[segIdx];
  return {
    lat: p1.lat + (p2.lat - p1.lat) * segT,
    lng: p1.lng + (p2.lng - p1.lng) * segT,
  };
}
