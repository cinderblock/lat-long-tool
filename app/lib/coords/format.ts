import type { Coordinate, Hemisphere } from "./types";

/** Number of decimals needed to represent a resolution step without inflating it. */
export function decimalsForStep(stepDeg: number): number {
  if (!(stepDeg > 0) || !isFinite(stepDeg)) return 6;
  return Math.max(0, Math.min(10, Math.ceil(-Math.log10(stepDeg))));
}

function fixed(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

function latHemisphere(lat: number): Hemisphere {
  return lat >= 0 ? "N" : "S";
}
function lonHemisphere(lon: number): Hemisphere {
  return lon >= 0 ? "E" : "W";
}

/** Decimal Degrees, signed: "40.748817, -73.985428". */
export function formatDD(c: Coordinate): string {
  const ld = decimalsForStep(c.latStepDeg);
  const od = decimalsForStep(c.lonStepDeg);
  return `${fixed(c.lat, ld)}, ${fixed(c.lon, od)}`;
}

/** Decimal Degrees with hemisphere letters: "40.748817° N, 73.985428° W". */
export function formatDDHemi(c: Coordinate): string {
  const ld = decimalsForStep(c.latStepDeg);
  const od = decimalsForStep(c.lonStepDeg);
  return (
    `${fixed(Math.abs(c.lat), ld)}° ${latHemisphere(c.lat)}, ` +
    `${fixed(Math.abs(c.lon), od)}° ${lonHemisphere(c.lon)}`
  );
}

interface DMSParts {
  deg: number;
  min: number;
  sec: number;
}

function toDMS(value: number): DMSParts {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let min = Math.floor((abs - deg) * 60);
  let sec = (abs - deg - min / 60) * 3600;
  // Guard against rounding pushing seconds/minutes to 60.
  if (sec >= 59.99995) {
    sec = 0;
    min += 1;
  }
  if (min >= 60) {
    min = 0;
    deg += 1;
  }
  return { deg, min, sec };
}

function toDDM(value: number): { deg: number; min: number } {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let min = (abs - deg) * 60;
  if (min >= 59.99999) {
    min = 0;
    deg += 1;
  }
  return { deg, min };
}

/** Degrees Decimal Minutes: "40° 44.929′ N, 73° 59.126′ W". */
export function formatDDM(c: Coordinate): string {
  const part = (value: number, hemi: Hemisphere) => {
    const { deg, min } = toDDM(value);
    return `${deg}° ${min.toFixed(3)}′ ${hemi}`;
  };
  return `${part(c.lat, latHemisphere(c.lat))}, ${part(c.lon, lonHemisphere(c.lon))}`;
}

/** Degrees Minutes Seconds: "40° 44′ 55.7″ N, 73° 59′ 7.5″ W". */
export function formatDMS(c: Coordinate): string {
  const part = (value: number, hemi: Hemisphere) => {
    const { deg, min, sec } = toDMS(value);
    return `${deg}° ${min}′ ${sec.toFixed(2)}″ ${hemi}`;
  };
  return `${part(c.lat, latHemisphere(c.lat))}, ${part(c.lon, lonHemisphere(c.lon))}`;
}

/** RFC 5870 geo: URI. */
export function formatGeoUri(c: Coordinate): string {
  const ld = decimalsForStep(c.latStepDeg);
  const od = decimalsForStep(c.lonStepDeg);
  return `geo:${fixed(c.lat, ld)},${fixed(c.lon, od)}`;
}

/** Plain signed pair without spaces, handy for code/CSV: "40.748817,-73.985428". */
export function formatPlain(c: Coordinate): string {
  const ld = decimalsForStep(c.latStepDeg);
  const od = decimalsForStep(c.lonStepDeg);
  return `${fixed(c.lat, ld)},${fixed(c.lon, od)}`;
}
