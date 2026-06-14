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
import { buildExamples, type Example } from "~/lib/examples";
import { CopyButton } from "./CopyButton";
import { HighlightedInput } from "./HighlightedInput";
import { MapIcon } from "./MapIcon";
import { MapPreview } from "./MapPreview";
import { What3Words } from "./What3Words";

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
      value: formatDDHemi(antipode(c)),
      hint: "opposite side of Earth",
    },
  ];
}

function readQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function writeQuery(value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("q", value);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

export function Tool() {
  const [input, setInput] = useState("");
  const [swap, setSwap] = useState(false);
  // Seeded so the server and first client render agree; randomized on mount.
  const [examples, setExamples] = useState<Example[]>(() => buildExamples(1));

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    const q = readQuery();
    if (q) setInput(q);
    setExamples(buildExamples(Math.floor(Math.random() * 1e9)));
  }, []);

  const updateInput = (value: string) => {
    setInput(value);
    if (typeof window !== "undefined") writeQuery(value);
  };

  const result = useMemo(
    () => parseCoordinates(input, { ...defaultAssumptions, swapLatLon: swap }),
    [input, swap],
  );

  const coord = result.coordinate;
  const hasInput = input.trim().length > 0;

  return (
    <div className="tool">
      <label className="input-label" htmlFor="coord-input">
        Paste a latitude / longitude
      </label>
      <HighlightedInput
        id="coord-input"
        value={input}
        onChange={updateInput}
        spans={{ latSpan: result.latSpan, lonSpan: result.lonSpan }}
        invalid={hasInput && !coord}
        placeholder={`e.g. 40°44'55.7"N 73°59'7.5"W`}
        badge={
          coord ? (
            <span className="format-badge">
              <span className="badge-dot badge-dot-lat" /> lat
              <span className="badge-dot badge-dot-lon" /> lon · {result.format}
            </span>
          ) : null
        }
      />

      {!coord && (
        <div className="examples">
          <span className="examples-label">Try:</span>
          {examples.map((ex) => (
            <button
              key={ex.text}
              type="button"
              className="example-chip"
              title={ex.label}
              onClick={() => {
                setSwap(false);
                updateInput(ex.text);
              }}
            >
              {ex.text}
            </button>
          ))}
        </div>
      )}

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

      {hasInput && !coord && <p className="error">{result.error}</p>}

      {coord && (
        <div className="results">
          <Section title="Formats" rows={formatRows(coord)} copyable />
          <Section title="Statistics" rows={statRows(coord)} />
          <MapPreview coord={coord} />
          <What3Words coord={coord} />

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
                  <MapIcon name={l.name} />
                  {l.name}
                  <span className="map-btn-ext" aria-hidden="true">
                    ↗
                  </span>
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
