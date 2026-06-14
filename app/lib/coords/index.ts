import type { Coordinate } from "./types";

export * from "./types";
export { parseCoordinates } from "./parse";
export {
  decimalsForStep,
  formatDD,
  formatDDHemi,
  formatDDM,
  formatDMS,
  formatGeoUri,
  formatPlain,
} from "./format";
export { encodeGeohash } from "./geohash";
export { encodeMaidenhead } from "./maidenhead";
export { encodeOLC } from "./olc";
export { toUTM, formatUTM, toMGRS } from "./utm";
export {
  estimateResolution,
  formatDistance,
  metersPerDegLat,
  metersPerDegLon,
} from "./precision";
export { mapLinks } from "./links";
export type { MapLink } from "./links";
export type { Resolution } from "./precision";

/** The point diametrically opposite on the globe. */
export function antipode(c: Coordinate): Coordinate {
  const lon = c.lon > 0 ? c.lon - 180 : c.lon + 180;
  return {
    lat: -c.lat,
    lon,
    latStepDeg: c.latStepDeg,
    lonStepDeg: c.lonStepDeg,
  };
}

/** A short description of which hemispheres the point sits in. */
export function hemisphereDescription(c: Coordinate): string {
  const ns = c.lat >= 0 ? "Northern" : "Southern";
  const ew = c.lon >= 0 ? "Eastern" : "Western";
  return `${ns} & ${ew} hemispheres`;
}
