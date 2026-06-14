import type { Coordinate } from "./types";

/** Metres per degree of latitude at latitude φ (WGS84 approximation). */
export function metersPerDegLat(latDeg: number): number {
  const phi = (latDeg * Math.PI) / 180;
  return (
    111132.92 -
    559.82 * Math.cos(2 * phi) +
    1.175 * Math.cos(4 * phi) -
    0.0023 * Math.cos(6 * phi)
  );
}

/** Metres per degree of longitude at latitude φ (WGS84 approximation). */
export function metersPerDegLon(latDeg: number): number {
  const phi = (latDeg * Math.PI) / 180;
  return (
    111412.84 * Math.cos(phi) -
    93.5 * Math.cos(3 * phi) +
    0.118 * Math.cos(5 * phi)
  );
}

export interface Resolution {
  /** Latitude cell size in metres implied by the input precision. */
  latMeters: number;
  /** Longitude cell size in metres implied by the input precision. */
  lonMeters: number;
  /** Worst-case (largest) of the two, the headline uncertainty. */
  worstMeters: number;
  /** Significant decimal digits of the latitude/longitude as given. */
  latDecimals: number;
  lonDecimals: number;
}

/** Estimate the ground resolution implied by how many digits the input had. */
export function estimateResolution(c: Coordinate): Resolution {
  const latMeters = c.latStepDeg * metersPerDegLat(c.lat);
  const lonMeters = c.lonStepDeg * metersPerDegLon(c.lat);
  return {
    latMeters,
    lonMeters,
    worstMeters: Math.max(latMeters, lonMeters),
    latDecimals: stepToDecimals(c.latStepDeg),
    lonDecimals: stepToDecimals(c.lonStepDeg),
  };
}

function stepToDecimals(stepDeg: number): number {
  if (!(stepDeg > 0)) return 0;
  return Math.max(0, Math.round(-Math.log10(stepDeg)));
}

/** Format a distance in metres into a friendly string (cm / m / km). */
export function formatDistance(meters: number): string {
  const m = Math.abs(meters);
  if (m < 0.01) return `${(m * 1000).toFixed(1)} mm`;
  if (m < 1) return `${(m * 100).toFixed(1)} cm`;
  if (m < 1000) return `${m < 10 ? m.toFixed(2) : m.toFixed(0)} m`;
  if (m < 100000) return `${(m / 1000).toFixed(2)} km`;
  return `${(m / 1000).toFixed(0)} km`;
}
