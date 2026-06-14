import { useEffect, useMemo, useState } from "react";
import {
  antipode,
  defaultAssumptions,
  encodeGeohash,
  encodeMaidenhead,
  encodeOLC,
  estimateResolution,
  formatDD,
  formatDDHemi,
  formatDDM,
  formatDistance,
  formatDMS,
  formatGeoUri,
  formatPlain,
  formatUTM,
  hemisphereDescription,
  mapLinks,
  parseCoordinates,
  toMGRS,
  toUTM,
  type Coordinate,
} from "~/lib/coords";
import { CopyButton } from "./CopyButton";

const EXAMPLES = [
  "40.748817, -73.985428",
  `40°44'55.7"N 73°59'7.5"W`,
  "40° 44.929' N, 73° 59.126' W",
  "S33.8568 E151.2153",
  "geo:48.8584,2.2945",
  "https://www.google.com/maps/@51.5007,-0.1246,17z",
];

interface Row {
  label: string;
  value: string;
  hint?: string;
}

function formatRows(c: Coordinate): Row[] {
  const utm = toUTM(c.lat, c.lon);
  return [
    { label: "Decimal degrees", value: formatDD(c), hint: "lat, lon" },
    { label: "Decimal + hemisphere", value: formatDDHemi(c) },
    { label: "Degrees decimal minutes", value: formatDDM(c), hint: "DDM" },
    { label: "Degrees minutes seconds", value: formatDMS(c), hint: "DMS" },
    { label: "Plain (no spaces)", value: formatPlain(c), hint: "CSV / code" },
    { label: "geo: URI", value: formatGeoUri(c), hint: "RFC 5870" },
    { label: "Plus Code", value: encodeOLC(c.lat, c.lon, 11), hint: "OLC" },
    { label: "Geohash", value: encodeGeohash(c.lat, c.lon, 11) },
    {
      label: "Maidenhead",
      value: encodeMaidenhead(c.lat, c.lon, 4),
      hint: "grid locator",
    },
    { label: "UTM", value: formatUTM(utm), hint: "WGS84" },
    { label: "MGRS", value: toMGRS(c.lat, c.lon), hint: "1 m" },
  ];
}

function statRows(c: Coordinate): Row[] {
  const res = estimateResolution(c);
  const anti = antipode(c);
  const digits = Math.max(res.latDecimals, res.lonDecimals);
  return [
    {
      label: "Implied resolution",
      value: `≈ ${formatDistance(res.worstMeters)}`,
      hint: `${digits} decimal place${digits === 1 ? "" : "s"} given`,
    },
    {
      label: "Resolution (lat / lon)",
      value: `${formatDistance(res.latMeters)} / ${formatDistance(res.lonMeters)}`,
    },
    { label: "Hemispheres", value: hemisphereDescription(c) },
    {
      label: "Antipode",
      value: `${anti.lat.toFixed(6)}, ${anti.lon.toFixed(6)}`,
      hint: "opposite side of Earth",
    },
  ];
}

export function Tool() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [swap, setSwap] = useState(false);

  // Signals that the app is interactive (used as a readiness marker by tests).
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  const result = useMemo(
    () => parseCoordinates(input, { ...defaultAssumptions, swapLatLon: swap }),
    [input, swap],
  );

  const coord = result.coordinate;

  return (
    <div className="tool">
      <label className="input-label" htmlFor="coord-input">
        Paste a latitude / longitude
      </label>
      <textarea
        id="coord-input"
        className="coord-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        rows={2}
        placeholder={`e.g. 40°44'55.7"N 73°59'7.5"W`}
        autoComplete="off"
      />

      <div className="examples">
        <span className="examples-label">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="example-chip"
            onClick={() => {
              setSwap(false);
              setInput(ex);
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {result.orderAmbiguous && (
        <label className="assumption">
          <input
            type="checkbox"
            checked={swap}
            onChange={(e) => setSwap(e.target.checked)}
          />
          <span>
            Order is ambiguous — treat input as{" "}
            <strong>
              {swap ? "longitude, latitude" : "latitude, longitude"}
            </strong>
          </span>
        </label>
      )}

      {result.warnings.map((w) => (
        <p key={w} className="warning">
          ⚠ {w}
        </p>
      ))}

      {!result.ok && input.trim() && <p className="error">{result.error}</p>}

      {coord && (
        <div className="results">
          <div className="summary">
            <div className="summary-main">
              <span className="summary-lat">{coord.lat.toFixed(6)}</span>
              <span className="summary-sep">,</span>
              <span className="summary-lon">{coord.lon.toFixed(6)}</span>
            </div>
            <span className="format-badge">parsed as {result.format}</span>
          </div>

          <Section title="Formats" rows={formatRows(coord)} copyable />
          <Section title="Statistics" rows={statRows(coord)} />

          <div className="maps">
            <h2>Open in maps</h2>
            <div className="map-buttons">
              {mapLinks(coord).map((l) => (
                <a
                  key={l.name}
                  className="map-btn"
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.name} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  copyable = false,
}: {
  title: string;
  rows: Row[];
  copyable?: boolean;
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <dl className="rows">
        {rows.map((r) => (
          <div key={r.label} className="row">
            <dt>
              {r.label}
              {r.hint && <span className="row-hint">{r.hint}</span>}
            </dt>
            <dd>
              <code>{r.value}</code>
              {copyable && <CopyButton value={r.value} />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
