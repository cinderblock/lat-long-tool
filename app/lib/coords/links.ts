import type { Coordinate } from "./types";
import { encodeGeohash } from "./geohash";

export interface MapLink {
  name: string;
  url: string;
}

/** Build "open in …" links for popular map services, each in its own format. */
export function mapLinks(c: Coordinate): MapLink[] {
  const lat = round(c.lat);
  const lon = round(c.lon);
  const pair = `${lat},${lon}`;
  return [
    {
      name: "Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${pair}`,
    },
    {
      name: "Apple Maps",
      url: `https://maps.apple.com/?ll=${pair}&q=${encodeURIComponent(pair)}`,
    },
    {
      name: "OpenStreetMap",
      url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
    },
    {
      name: "Bing Maps",
      url: `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=16&sp=point.${lat}_${lon}`,
    },
    {
      name: "Google Earth",
      url: `https://earth.google.com/web/@${lat},${lon},0a,1000d,35y`,
    },
    {
      name: "Waze",
      url: `https://www.waze.com/ul?ll=${pair}&navigate=yes`,
    },
    {
      name: "what3words",
      url: `https://what3words.com/?maptype=roadmap&zoom=19&center=${pair}`,
    },
    {
      name: "geohash.org",
      url: `http://geohash.org/${encodeGeohash(c.lat, c.lon, 9)}`,
    },
    {
      name: "Caltopo",
      url: `https://caltopo.com/map.html#ll=${pair}&z=15`,
    },
  ];
}

function round(n: number): string {
  // 7 decimals ≈ 1 cm, plenty for any map service, trimmed of trailing zeros.
  return Number(n.toFixed(7)).toString();
}
