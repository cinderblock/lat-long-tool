import { useState } from "react";
import type { Coordinate } from "~/lib/coords";

/**
 * An OpenStreetMap embed for the coordinate. It only loads once the user opts
 * in (the iframe fetches tiles from openstreetmap.org), so the tool stays fully
 * local until then.
 */
export function MapPreview({ coord }: { coord: Coordinate }) {
  const [shown, setShown] = useState(false);
  const d = 0.008;
  const bbox = `${coord.lon - d}%2C${coord.lat - d}%2C${coord.lon + d}%2C${coord.lat + d}`;
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${coord.lat}%2C${coord.lon}`;
  const fullMap =
    `https://www.openstreetmap.org/?mlat=${coord.lat}&mlon=${coord.lon}` +
    `#map=14/${coord.lat}/${coord.lon}`;

  return (
    <section className="card map-preview">
      <h2>Map preview</h2>
      {shown ? (
        <>
          <iframe
            className="map-frame"
            title="OpenStreetMap preview"
            src={src}
            loading="lazy"
          />
          <p className="w3w-note">
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
