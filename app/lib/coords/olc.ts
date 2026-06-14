// Open Location Code (Google Plus Codes) encoder, ported from the reference
// implementation at https://github.com/google/open-location-code.

const CODE_ALPHABET = "23456789CFGHJMPQRVWX";
const SEPARATOR = "+";
const SEPARATOR_POSITION = 8;
const PADDING = "0";
const ENCODING_BASE = 20;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const MAX_DIGIT_COUNT = 15;
const PAIR_CODE_LENGTH = 10;
const GRID_CODE_LENGTH = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH;
const GRID_COLUMNS = 4;
const GRID_ROWS = 5;
const PAIR_PRECISION = ENCODING_BASE ** 3;
const FINAL_LAT_PRECISION = PAIR_PRECISION * GRID_ROWS ** GRID_CODE_LENGTH;
const FINAL_LNG_PRECISION = PAIR_PRECISION * GRID_COLUMNS ** GRID_CODE_LENGTH;

function clipLatitude(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

function normalizeLongitude(lon: number): number {
  let l = lon;
  while (l < -180) l += 360;
  while (l >= 180) l -= 360;
  return l;
}

function computeLatitudePrecision(codeLength: number): number {
  if (codeLength <= 10) {
    return ENCODING_BASE ** (Math.floor(codeLength / -2) + 2);
  }
  return ENCODING_BASE ** -3 / GRID_ROWS ** (codeLength - 10);
}

/** Encode a coordinate as a plus code. Default length 11 ≈ 3 m. */
export function encodeOLC(
  latitude: number,
  longitude: number,
  codeLength = 11,
): string {
  let lat = clipLatitude(latitude);
  const lon = normalizeLongitude(longitude);
  // The poles need a nudge so they encode inside a valid cell.
  if (lat === 90) lat -= 0.9 * computeLatitudePrecision(codeLength);

  let code = "";

  // Kept as integers scaled by the final precision to avoid float drift.
  let latVal =
    Math.round((lat + LATITUDE_MAX) * FINAL_LAT_PRECISION * 1e6) / 1e6;
  let lngVal =
    Math.round((lon + LONGITUDE_MAX) * FINAL_LNG_PRECISION * 1e6) / 1e6;

  if (codeLength > PAIR_CODE_LENGTH) {
    for (let i = 0; i < GRID_CODE_LENGTH; i++) {
      const latDigit = latVal % GRID_ROWS;
      const lngDigit = lngVal % GRID_COLUMNS;
      const ndx = Math.floor(latDigit) * GRID_COLUMNS + Math.floor(lngDigit);
      code = CODE_ALPHABET.charAt(ndx) + code;
      latVal = Math.floor(latVal / GRID_ROWS);
      lngVal = Math.floor(lngVal / GRID_COLUMNS);
    }
  } else {
    latVal = Math.floor(latVal / GRID_ROWS ** GRID_CODE_LENGTH);
    lngVal = Math.floor(lngVal / GRID_COLUMNS ** GRID_CODE_LENGTH);
  }

  for (let i = 0; i < PAIR_CODE_LENGTH / 2; i++) {
    code = CODE_ALPHABET.charAt(Math.floor(lngVal % ENCODING_BASE)) + code;
    code = CODE_ALPHABET.charAt(Math.floor(latVal % ENCODING_BASE)) + code;
    latVal = Math.floor(latVal / ENCODING_BASE);
    lngVal = Math.floor(lngVal / ENCODING_BASE);
  }

  code =
    code.substring(0, SEPARATOR_POSITION) +
    SEPARATOR +
    code.substring(SEPARATOR_POSITION);

  if (codeLength >= SEPARATOR_POSITION) {
    return code.substring(0, codeLength + 1);
  }
  return (
    code.substring(0, codeLength) +
    PADDING.repeat(SEPARATOR_POSITION - codeLength) +
    SEPARATOR
  );
}
