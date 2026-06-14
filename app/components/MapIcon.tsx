import {
  siApple,
  siGoogleearth,
  siGooglemaps,
  siOpenstreetmap,
  siWaze,
} from "simple-icons";

// Brand glyphs (rendered in currentColor so they stay theme-aware). Services
// without a simple-icons brand mark fall back to a generic location pin.
const BRAND: Record<string, { path: string }> = {
  "Google Maps": siGooglemaps,
  "Apple Maps": siApple,
  OpenStreetMap: siOpenstreetmap,
  "Google Earth": siGoogleearth,
  Waze: siWaze,
};

const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";

export function MapIcon({ name }: { name: string }) {
  const path = BRAND[name]?.path ?? PIN_PATH;
  return (
    <svg
      className="map-icon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
