// WGS84 UTM forward projection (Snyder series) and MGRS derivation.
// MGRS 100km-square lettering ported from proj4js/mgrs.

const A_AXIS = 6378137.0;
const FLATTENING = 1 / 298.257223563;
const K0 = 0.9996;
const E2 = FLATTENING * (2 - FLATTENING);
const EP2 = E2 / (1 - E2);

export interface UTM {
  zone: number;
  hemisphere: "N" | "S";
  band: string;
  easting: number;
  northing: number;
}

function utmZone(lat: number, lon: number): number {
  let zone = Math.floor((lon + 180) / 6) + 1;
  // Norway and Svalbard exceptions.
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) zone = 31;
    else if (lon >= 9 && lon < 21) zone = 33;
    else if (lon >= 21 && lon < 33) zone = 35;
    else if (lon >= 33 && lon < 42) zone = 37;
  }
  return zone;
}

const BANDS = "CDEFGHJKLMNPQRSTUVWX";

function latBand(lat: number): string {
  if (lat < -80) return "A";
  if (lat > 84) return "Z";
  return BANDS[Math.min(BANDS.length - 1, Math.floor((lat + 80) / 8))];
}

/** Project a coordinate to UTM (WGS84). */
export function toUTM(lat: number, lon: number): UTM {
  const zone = utmZone(lat, lon);
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const lon0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);

  const N = A_AXIS / Math.sqrt(1 - E2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = EP2 * cosLat * cosLat;
  const Aa = cosLat * (lonRad - lon0);

  const M =
    A_AXIS *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 * E2 * E2) / 256) * latRad -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 * E2 * E2) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * E2 * E2) / 256 + (45 * E2 * E2 * E2) / 1024) *
        Math.sin(4 * latRad) -
      ((35 * E2 * E2 * E2) / 3072) * Math.sin(6 * latRad));

  const easting =
    K0 *
      N *
      (Aa +
        ((1 - T + C) * Aa ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Aa ** 5) / 120) +
    500000;

  let northing =
    K0 *
    (M +
      N *
        tanLat *
        ((Aa * Aa) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Aa ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Aa ** 6) / 720));

  if (lat < 0) northing += 10000000;

  return {
    zone,
    hemisphere: lat >= 0 ? "N" : "S",
    band: latBand(lat),
    easting,
    northing,
  };
}

/** Human-readable UTM string: "18N 585628 4511322". */
export function formatUTM(u: UTM): string {
  return `${u.zone}${u.hemisphere} ${Math.round(u.easting)}E ${Math.round(u.northing)}N`;
}

const A = 65;
const I = 73;
const O = 79;
const V = 86;
const Z = 90;
const SET_ORIGIN_COLUMN_LETTERS = "AJSAJS";
const SET_ORIGIN_ROW_LETTERS = "AFAFAF";

function get100kID(easting: number, northing: number, zone: number): string {
  let set = zone % 6;
  if (set === 0) set = 6;
  const column = Math.floor(easting / 100000);
  const row = Math.floor(northing / 100000) % 20;
  return getLetter100kID(column, row, set);
}

function getLetter100kID(column: number, row: number, parm: number): string {
  const index = parm - 1;
  const colOrigin = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(index);
  const rowOrigin = SET_ORIGIN_ROW_LETTERS.charCodeAt(index);

  let colInt = colOrigin + column - 1;
  let rowInt = rowOrigin + row;
  let rollover = false;

  if (colInt > Z) {
    colInt = colInt - Z + A - 1;
    rollover = true;
  }
  if (
    colInt === I ||
    (colOrigin < I && colInt > I) ||
    ((colInt > I || colOrigin < I) && rollover)
  ) {
    colInt++;
  }
  if (
    colInt === O ||
    (colOrigin < O && colInt > O) ||
    ((colInt > O || colOrigin < O) && rollover)
  ) {
    colInt++;
    if (colInt === I) colInt++;
  }
  if (colInt > Z) colInt = colInt - Z + A - 1;

  if (rowInt > V) {
    rowInt = rowInt - V + A - 1;
    rollover = true;
  } else {
    rollover = false;
  }
  if (
    rowInt === I ||
    (rowOrigin < I && rowInt > I) ||
    ((rowInt > I || rowOrigin < I) && rollover)
  ) {
    rowInt++;
  }
  if (
    rowInt === O ||
    (rowOrigin < O && rowInt > O) ||
    ((rowInt > O || rowOrigin < O) && rollover)
  ) {
    rowInt++;
    if (rowInt === I) rowInt++;
  }
  if (rowInt > V) rowInt = rowInt - V + A - 1;

  return String.fromCharCode(colInt) + String.fromCharCode(rowInt);
}

/** MGRS string at 1 m precision: "18T WL 85628 11322". */
export function toMGRS(lat: number, lon: number): string {
  const u = toUTM(lat, lon);
  const square = get100kID(u.easting, u.northing, u.zone);
  const e = Math.floor(u.easting % 100000)
    .toString()
    .padStart(5, "0");
  const n = Math.floor(u.northing % 100000)
    .toString()
    .padStart(5, "0");
  return `${u.zone}${u.band} ${square} ${e} ${n}`;
}
