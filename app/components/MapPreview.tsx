import { useEffect, useRef, useState } from "react";
import type { Circle, LayerGroup, Map as LeafletMap } from "leaflet";
import {
  estimateResolution,
  formatDistance,
  type Coordinate,
} from "~/lib/coords";
import "leaflet/dist/leaflet.css";

/**
 * An OpenStreetMap (Leaflet) preview for the coordinate, with a shaded circle
 * whose diameter equals the implied resolution. It only loads once the user
 * opts in (Leaflet and tiles are fetched then), so the tool stays local until
 * then. Leaflet is imported dynamically because it touches `window`.
 */
export function MapPreview({ coord }: { coord: Coordinate }) {
  const [shown, setShown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const overlayRef = useRef<LayerGroup | null>(null);

  const res = estimateResolution(coord);
  // Diameter of the circle equals the implied resolution.
  const radiusMeters = Math.max(res.worstMeters / 2, 0.5);

  // Create / destroy the map when the preview is shown / hidden.
  useEffect(() => {
    if (!shown || !containerRef.current) return;
    let cancelled = false;
    let map: LeafletMap | undefined;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      // An initial view is required before the map can project (draw a circle
      // or load tiles); fitBounds in drawOverlay then refines it.
      map = L.map(containerRef.current).setView([coord.lat, coord.lon], 16);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      drawOverlay(L, map);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [shown]);

  // Re-draw the marker + circle when the coordinate or resolution changes.
  useEffect(() => {
    if (!shown || !mapRef.current) return;
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;
      drawOverlay(L, mapRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [shown, coord.lat, coord.lon, radiusMeters]);

  function drawOverlay(L: typeof import("leaflet"), map: LeafletMap) {
    overlayRef.current?.remove();
    const center: [number, number] = [coord.lat, coord.lon];
    const circle: Circle = L.circle(center, {
      radius: radiusMeters,
      color: "#2563eb",
      weight: 1,
      fillColor: "#2563eb",
      fillOpacity: 0.15,
    });
    const dot = L.circleMarker(center, {
      radius: 3,
      color: "#2563eb",
      fillColor: "#2563eb",
      fillOpacity: 1,
      weight: 1,
    });
    overlayRef.current = L.layerGroup([circle, dot]).addTo(map);
    map.fitBounds(circle.getBounds().pad(1.5), { maxZoom: 19 });
  }

  const fullMap =
    `https://www.openstreetmap.org/?mlat=${coord.lat}&mlon=${coord.lon}` +
    `#map=16/${coord.lat}/${coord.lon}`;

  return (
    <section className="card map-preview">
      <h2>Map preview</h2>
      {shown ? (
        <>
          <div className="map-frame" ref={containerRef} />
          <p className="card-note">
            Shaded circle ≈ the implied resolution (
            {formatDistance(res.worstMeters)} across). ·{" "}
            <a href={fullMap} target="_blank" rel="noopener noreferrer">
              Open larger map ↗
            </a>{" "}
            · tiles © OpenStreetMap contributors
          </p>
        </>
      ) : (
        <button
          type="button"
          className="map-show-btn"
          onClick={() => setShown(true)}
        >
          Show map — loads tiles from OpenStreetMap
        </button>
      )}
    </section>
  );
}
