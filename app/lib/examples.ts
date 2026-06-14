import type { Coordinate } from "./coords";
import {
  formatDD,
  formatDDHemi,
  formatDDM,
  formatDMS,
  formatGeoUri,
} from "./coords";

interface Place {
  name: string;
  lat: number;
  lon: number;
}

// A spread of recognisable places across all four hemispheres.
const PLACES: Place[] = [
  { name: "Statue of Liberty", lat: 40.6892, lon: -74.0445 },
  { name: "Eiffel Tower", lat: 48.8584, lon: 2.2945 },
  { name: "Sydney Opera House", lat: -33.8568, lon: 151.2153 },
  { name: "Christ the Redeemer", lat: -22.9519, lon: -43.2105 },
  { name: "Great Pyramid of Giza", lat: 29.9792, lon: 31.1342 },
  { name: "Taj Mahal", lat: 27.1751, lon: 78.0421 },
  { name: "Table Mountain", lat: -33.9628, lon: 18.4098 },
  { name: "Machu Picchu", lat: -13.1631, lon: -72.545 },
  { name: "Mount Fuji", lat: 35.3606, lon: 138.7274 },
  { name: "Big Ben", lat: 51.5007, lon: -0.1246 },
  { name: "Golden Gate Bridge", lat: 37.8199, lon: -122.4783 },
  { name: "Colosseum", lat: 41.8902, lon: 12.4922 },
  { name: "Burj Khalifa", lat: 25.1972, lon: 55.2744 },
  { name: "Uluru", lat: -25.3444, lon: 131.0369 },
  { name: "Reykjavík", lat: 64.1466, lon: -21.9426 },
  { name: "Ushuaia", lat: -54.8019, lon: -68.303 },
];

/** Deterministic PRNG so the server and first client render agree. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Example {
  /** The coordinate string a user can paste. */
  text: string;
  /** Human-readable place name + format, used as a tooltip. */
  label: string;
}

const FORMATTERS: { name: string; fn: (c: Coordinate) => string }[] = [
  { name: "decimal", fn: formatDD },
  { name: "DMS", fn: formatDMS },
  { name: "DDM", fn: formatDDM },
  { name: "decimal + hemisphere", fn: formatDDHemi },
  { name: "geo URI", fn: formatGeoUri },
];

/**
 * Pick `count` random places (seeded so it's stable for a given seed) and
 * render each in a different coordinate format.
 */
export function buildExamples(seed: number, count = 5): Example[] {
  const rng = mulberry32(seed || 1);
  const shuffled = [...PLACES].sort(() => rng() - 0.5).slice(0, count);
  return shuffled.map((p, i) => {
    const coord: Coordinate = {
      lat: p.lat,
      lon: p.lon,
      latStepDeg: 1e-4,
      lonStepDeg: 1e-4,
    };
    const { name: fmtName, fn } = FORMATTERS[i % FORMATTERS.length];
    return { text: fn(coord), label: `${p.name} (${fmtName})` };
  });
}
