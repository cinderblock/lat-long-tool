import { useRef, type ReactNode } from "react";
import type { Spans } from "~/lib/coords";

interface Props {
  value: string;
  onChange: (value: string) => void;
  spans: Spans;
  badge?: ReactNode;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
}

interface Seg {
  text: string;
  kind?: "lat" | "lon";
}

/** Split the input text into plain and lat/lon-highlighted segments. */
function toSegments(value: string, spans: Spans): Seg[] {
  const marks = (
    [
      spans.latSpan && { ...range(spans.latSpan), kind: "lat" as const },
      spans.lonSpan && { ...range(spans.lonSpan), kind: "lon" as const },
    ].filter(Boolean) as { start: number; end: number; kind: "lat" | "lon" }[]
  ).sort((a, b) => a.start - b.start);

  const segs: Seg[] = [];
  let i = 0;
  for (const m of marks) {
    if (m.start < i) continue; // ignore overlaps
    if (m.start > i) segs.push({ text: value.slice(i, m.start) });
    segs.push({ text: value.slice(m.start, m.end), kind: m.kind });
    i = m.end;
  }
  if (i < value.length) segs.push({ text: value.slice(i) });
  return segs;
}

function range([start, end]: [number, number]) {
  return { start, end };
}

/**
 * A single-line text input that colour-highlights which characters were read
 * as latitude vs. longitude, using a mirrored backdrop behind the input.
 */
export function HighlightedInput({
  value,
  onChange,
  spans,
  badge,
  invalid,
  id,
  placeholder,
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const segs = toSegments(value, spans);

  return (
    <div className={`coord-field${invalid ? " is-invalid" : ""}`}>
      <div className="coord-backdrop" ref={backdropRef} aria-hidden="true">
        {segs.map((s, idx) =>
          s.kind ? (
            <span key={idx} className={`hl hl-${s.kind}`}>
              {s.text}
            </span>
          ) : (
            <span key={idx}>{s.text}</span>
          ),
        )}
      </div>
      <input
        id={id}
        className="coord-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (backdropRef.current) {
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={placeholder}
      />
      {badge && <div className="coord-badge">{badge}</div>}
    </div>
  );
}
