export type Hemisphere = "N" | "S" | "E" | "W";

/** User-settable assumptions used to resolve ambiguous input. */
export interface Assumptions {
  /** When lat/lon order can't be inferred, swap the two components. */
  swapLatLon: boolean;
}

export const defaultAssumptions: Assumptions = {
  swapLatLon: false,
};

/** A fully resolved geographic point plus the precision implied by the input. */
export interface Coordinate {
  /** Signed decimal degrees, north positive. */
  lat: number;
  /** Signed decimal degrees, east positive. */
  lon: number;
  /** Resolution step of the latitude implied by the input, in degrees. */
  latStepDeg: number;
  /** Resolution step of the longitude implied by the input, in degrees. */
  lonStepDeg: number;
}

export type CoordFormat = "DD" | "DDM" | "DMS" | "geo" | "url" | "unknown";

export interface ParseResult {
  ok: boolean;
  coordinate?: Coordinate;
  /** How the input was interpreted. */
  format: CoordFormat;
  /** True when the lat/lon order is genuinely ambiguous (drives the swap UI). */
  orderAmbiguous: boolean;
  /** Non-fatal notes about how the input was interpreted. */
  warnings: string[];
  /** Fatal reason when ok === false. */
  error?: string;
}
