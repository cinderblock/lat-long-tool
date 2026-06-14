/**
 * Encode a coordinate as a Maidenhead grid locator (ham-radio grid square).
 * Default precision 3 pairs (e.g. "FN30as") ≈ a few hundred metres.
 * https://en.wikipedia.org/wiki/Maidenhead_Locator_System
 */
export function encodeMaidenhead(lat: number, lon: number, pairs = 4): string {
  let lonR = lon + 180;
  let latR = lat + 90;
  let out = "";

  // Field: 18 zones of 20° lon / 10° lat, letters A–R.
  out += String.fromCharCode(65 + Math.floor(lonR / 20));
  out += String.fromCharCode(65 + Math.floor(latR / 10));
  lonR %= 20;
  latR %= 10;

  // Square: digits 0–9 over 2° lon / 1° lat.
  out += Math.floor(lonR / 2).toString();
  out += Math.floor(latR / 1).toString();
  lonR %= 2;
  latR %= 1;

  // Subsequent pairs alternate letters (a–x) then digits, each ÷24 then ÷10.
  for (let p = 2; p < pairs; p++) {
    if (p % 2 === 0) {
      const lonStep = 2 / 24;
      const latStep = 1 / 24;
      out += String.fromCharCode(97 + Math.floor(lonR / lonStep));
      out += String.fromCharCode(97 + Math.floor(latR / latStep));
      lonR %= lonStep;
      latR %= latStep;
    } else {
      const lonStep = 2 / 24 / 10;
      const latStep = 1 / 24 / 10;
      out += Math.floor(lonR / lonStep).toString();
      out += Math.floor(latR / latStep).toString();
      lonR %= lonStep;
      latR %= latStep;
    }
  }
  return out;
}
