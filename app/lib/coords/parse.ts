import type {
  Assumptions,
  Coordinate,
  CoordFormat,
  Hemisphere,
  ParseResult,
} from "./types";

/**
 * A single coordinate component extracted from the input, before it has been
 * assigned to a role (latitude vs. longitude) and given a final sign.
 */
interface RawComponent {
  /** Magnitude in decimal degrees (always >= 0). */
  magnitude: number;
  /** Sign explicitly written as +/- on the degrees value (1 or -1). */
  numericSign: 1 | -1;
  /** Whether a +/- was actually present. */
  hadSign: boolean;
  /** Explicit hemisphere letter, if any. */
  hemisphere?: Hemisphere;
  /** Resolution step in degrees implied by the least significant input digit. */
  stepDeg: number;
  /** Character range [start, end) this component covers in the input. */
  span: [number, number];
}

type TokenType = "num" | "hemi" | "deg" | "min" | "sec";
interface Token {
  type: TokenType;
  text: string;
  value?: number;
  decimals?: number;
  /** Character offsets of this token in the input string. */
  start: number;
  end: number;
}

const TOKEN_RE = new RegExp(
  [
    "(?<deg>°|º|∘|degrees?\\b)",
    "(?<min>′|minutes?\\b)",
    "(?<sec>″|\"|''|seconds?\\b)",
    "(?<hemi>[NSEWnsew])",
    "(?<num>[+\\-\\u2212]?\\d+(?:\\.\\d+)?)",
    "(?<prime>'|\\u2019)", // single prime: minutes, handled after sec/'' check
  ].join("|"),
  "g",
);

function decimalsOf(text: string): number {
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  for (const m of input.matchAll(TOKEN_RE)) {
    const g = m.groups!;
    const start = m.index;
    const end = start + m[0].length;
    if (g.deg !== undefined)
      tokens.push({ type: "deg", text: m[0], start, end });
    else if (g.min !== undefined) {
      tokens.push({ type: "min", text: m[0], start, end });
    } else if (g.sec !== undefined) {
      tokens.push({ type: "sec", text: m[0], start, end });
    } else if (g.prime !== undefined) {
      tokens.push({ type: "min", text: m[0], start, end });
    } else if (g.hemi !== undefined) {
      tokens.push({ type: "hemi", text: m[0].toUpperCase(), start, end });
    } else if (g.num !== undefined) {
      const norm = m[0].replace("−", "-");
      tokens.push({
        type: "num",
        text: norm,
        value: Math.abs(Number(norm)),
        decimals: decimalsOf(norm),
        start,
        end,
      });
    }
  }
  return tokens;
}

function signOf(text: string): { sign: 1 | -1; hadSign: boolean } {
  if (text.startsWith("-") || text.startsWith("−")) {
    return { sign: -1, hadSign: true };
  }
  if (text.startsWith("+")) return { sign: 1, hadSign: true };
  return { sign: 1, hadSign: false };
}

/** Build a RawComponent from up to three numbers (deg, min, sec) + a hemisphere. */
function buildComponent(
  nums: Token[],
  hemiToken: Token | undefined,
): RawComponent {
  const deg = nums[0];
  const min = nums[1];
  const sec = nums[2];
  const { sign, hadSign } = signOf(deg.text);

  let magnitude = deg.value!;
  if (min) magnitude += min.value! / 60;
  if (sec) magnitude += sec.value! / 3600;

  // Resolution: the step of the least significant digit of the finest field.
  let stepDeg: number;
  if (sec) stepDeg = 10 ** -sec.decimals! / 3600;
  else if (min) stepDeg = 10 ** -min.decimals! / 60;
  else stepDeg = 10 ** -deg.decimals!;

  // Character span: the numbers plus the hemisphere letter, if attached.
  const parts = hemiToken ? [...nums, hemiToken] : nums;
  const span: [number, number] = [
    Math.min(...parts.map((t) => t.start)),
    Math.max(...parts.map((t) => t.end)),
  ];

  return {
    magnitude,
    numericSign: sign,
    hadSign,
    hemisphere: hemiToken?.text as Hemisphere | undefined,
    stepDeg,
    span,
  };
}

/**
 * Group a flat token stream into coordinate components.
 *
 * When unit symbols (° ' ") are present we use them to delimit components.
 * Otherwise we fall back to splitting an even count of numbers (2/4/6) evenly
 * into two components (DD / DDM / DMS).
 */
function groupComponents(tokens: Token[]): {
  components: RawComponent[];
  format: CoordFormat;
  warnings: string[];
} {
  const warnings: string[] = [];
  const hasSymbols = tokens.some(
    (t) => t.type === "deg" || t.type === "min" || t.type === "sec",
  );

  const { groups, format } = hasSymbols
    ? groupBySymbols(tokens)
    : groupByCount(tokens);

  if (groups.length < 1) return { components: [], format, warnings };

  // Each group is [deg, min?, sec?]. Attach hemisphere tokens greedily 1:1.
  const hemis = tokens.filter((t) => t.type === "hemi");
  const assigned = assignHemispheres(tokens, groups, hemis);
  const components = groups.map((g, i) => buildComponent(g, assigned[i]));
  return { components, format, warnings };
}

/** Split an even count of bare numbers (2/4/6) into two DD/DDM/DMS groups. */
function groupByCount(tokens: Token[]): {
  groups: Token[][];
  format: CoordFormat;
} {
  const nums = tokens.filter((t) => t.type === "num");
  let perComponent: number;
  let format: CoordFormat;
  if (nums.length === 2) ((perComponent = 1), (format = "DD"));
  else if (nums.length === 4) ((perComponent = 2), (format = "DDM"));
  else if (nums.length === 6) ((perComponent = 3), (format = "DMS"));
  else return { groups: [], format: "unknown" };

  const groups: Token[][] = [];
  for (let i = 0; i < 2; i++) {
    groups.push(nums.slice(i * perComponent, (i + 1) * perComponent));
  }
  return { groups, format };
}

/** Group numbers into components using the unit symbols (° ' ") as delimiters. */
function groupBySymbols(tokens: Token[]): {
  groups: Token[][];
  format: CoordFormat;
} {
  const groups: Token[][] = [];
  let nums: (Token | undefined)[] = [];
  let hasDeg = false;
  let sawMinAny = false;
  let sawSecAny = false;

  const flush = () => {
    if (nums[0]) groups.push(nums as Token[]);
    nums = [];
    hasDeg = false;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== "num") continue;
    // The unit symbol that immediately follows tells us the number's role.
    const next = tokens[i + 1]?.type;
    if (next === "min") {
      nums[1] = t;
      sawMinAny = true;
    } else if (next === "sec") {
      nums[2] = t;
      sawSecAny = true;
    } else {
      // Bare number (or one followed by °) is degrees; a second degrees
      // value means a new component has started.
      if (hasDeg) flush();
      nums[0] = t;
      hasDeg = true;
    }
  }
  flush();

  const format: CoordFormat = sawSecAny ? "DMS" : sawMinAny ? "DDM" : "DD";
  return { groups, format };
}

/**
 * Attach hemisphere letters to number-groups, each letter and group used at
 * most once, pairing the closest letter/group by position. This handles
 * prefix ("N40 W73"), suffix ("40N 73W"), and lon-first orderings uniformly.
 */
function assignHemispheres(
  tokens: Token[],
  groups: Token[][],
  hemis: Token[],
): (Token | undefined)[] {
  const result: (Token | undefined)[] = new Array(groups.length);
  if (hemis.length === 0) return result;

  const starts = groups.map((g) => tokens.indexOf(g[0]));
  const firstNum = tokens.findIndex((t) => t.type === "num");
  // Is the convention "N40" (letter before number) or "40N" (letter after)?
  const prefixStyle = tokens.indexOf(hemis[0]) < firstNum;
  const used = new Set<number>();

  for (const h of hemis) {
    const hi = tokens.indexOf(h);
    let best = -1;
    let bestDist = Infinity;
    for (let ci = 0; ci < groups.length; ci++) {
      if (used.has(ci)) continue;
      const s = starts[ci];
      // Prefer the group the letter binds to per the detected style, but fall
      // back (with a large penalty) so every letter still lands somewhere.
      const onSide = prefixStyle ? s >= hi : s <= hi;
      const dist = Math.abs(s - hi) + (onSide ? 0 : 1000);
      if (dist < bestDist) {
        bestDist = dist;
        best = ci;
      }
    }
    if (best >= 0) {
      result[best] = h;
      used.add(best);
    }
  }
  return result;
}

/** Extract lat/lon from common URL and geo: URI formats. Returns null if none. */
function parseUrl(input: string): {
  lat: number;
  lon: number;
  latText: string;
  lonText: string;
  latSpan?: [number, number];
  lonSpan?: [number, number];
} | null {
  const num = "[+-]?\\d+(?:\\.\\d+)?";
  const patterns: RegExp[] = [
    /geo:(?<lat>[+-]?\d+(?:\.\d+)?),(?<lon>[+-]?\d+(?:\.\d+)?)/di,
    new RegExp(`@(?<lat>${num}),(?<lon>${num})`, "d"), // google maps @lat,lng
    new RegExp(
      `[?&](?:q|ll|sll|daddr|saddr)=(?<lat>${num}),(?<lon>${num})`,
      "id",
    ),
    new RegExp(`!3d(?<lat>${num})!4d(?<lon>${num})`, "d"), // google place
    new RegExp(`mlat=(?<lat>${num}).*?mlon=(?<lon>${num})`, "id"), // osm marker
    new RegExp(`#map=\\d+/(?<lat>${num})/(?<lon>${num})`, "d"), // osm hash
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m?.groups) {
      const gi = m.indices?.groups;
      return {
        lat: Number(m.groups.lat),
        lon: Number(m.groups.lon),
        latText: m.groups.lat,
        lonText: m.groups.lon,
        latSpan: gi?.lat ? [gi.lat[0], gi.lat[1]] : undefined,
        lonSpan: gi?.lon ? [gi.lon[0], gi.lon[1]] : undefined,
      };
    }
  }
  return null;
}

/**
 * Parse almost any latitude/longitude string into a resolved Coordinate.
 *
 * The result depends on `assumptions` only when the input is genuinely
 * ambiguous (see `orderAmbiguous`).
 */
export function parseCoordinates(
  input: string,
  assumptions: Assumptions,
): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      format: "unknown",
      orderAmbiguous: false,
      warnings: [],
      error: "Enter a latitude/longitude string above.",
    };
  }

  // URLs / geo: URIs are unambiguous lat,lon.
  if (/:\/\//.test(trimmed) || /^geo:/i.test(trimmed)) {
    const u = parseUrl(input);
    if (u) {
      const coord: Coordinate = {
        lat: u.lat,
        lon: u.lon,
        latStepDeg: 10 ** -decimalsOf(u.latText),
        lonStepDeg: 10 ** -decimalsOf(u.lonText),
      };
      const warnings = rangeWarnings(coord);
      return {
        ok: warnings.fatal === undefined,
        coordinate: warnings.fatal ? undefined : coord,
        format: /^geo:/i.test(trimmed) ? "geo" : "url",
        orderAmbiguous: false,
        warnings: warnings.list,
        error: warnings.fatal,
        latSpan: u.latSpan,
        lonSpan: u.lonSpan,
      };
    }
  }

  // Tokenize the raw input so character spans align with what the user typed.
  const tokens = tokenize(input);
  const { components, format, warnings } = groupComponents(tokens);

  if (components.length < 2) {
    return {
      ok: false,
      format: "unknown",
      orderAmbiguous: false,
      warnings,
      error:
        'Couldn\'t find two coordinate values. Try e.g. "40.7128, -74.0060".',
    };
  }
  if (components.length > 2) {
    warnings.push("More than two values found; using the first two.");
    components.length = 2;
  }

  const [a, b] = components;
  const resolved = resolveRoles(a, b, assumptions, warnings);

  const range = rangeWarnings(resolved.coordinate);
  for (const w of range.list) warnings.push(w);

  return {
    ok: range.fatal === undefined,
    coordinate: range.fatal ? undefined : resolved.coordinate,
    format,
    orderAmbiguous: resolved.orderAmbiguous,
    warnings,
    error: range.fatal,
    latSpan: resolved.latSpan,
    lonSpan: resolved.lonSpan,
  };
}

/** Apply a hemisphere letter / numeric sign to a magnitude. */
function signedValue(c: RawComponent, axis: "lat" | "lon"): number {
  if (c.hemisphere) {
    const negative = c.hemisphere === "S" || c.hemisphere === "W";
    return negative ? -c.magnitude : c.magnitude;
  }
  void axis;
  return c.numericSign * c.magnitude;
}

/**
 * Decide which component is latitude and which is longitude, then apply signs.
 */
function resolveRoles(
  a: RawComponent,
  b: RawComponent,
  assumptions: Assumptions,
  warnings: string[],
): {
  coordinate: Coordinate;
  orderAmbiguous: boolean;
  latSpan: [number, number];
  lonSpan: [number, number];
} {
  const aAxis = axisOf(a);
  const bAxis = axisOf(b);

  let latC: RawComponent;
  let lonC: RawComponent;
  let orderAmbiguous = false;

  if (aAxis && bAxis && aAxis === bAxis) {
    // Both values claim the same axis; keep input order but warn.
    ((latC = a), (lonC = b));
    warnings.push("Both values look like the same axis; check the result.");
  } else if (aAxis === "lat" || bAxis === "lon") {
    // a is latitude (or b is longitude) → natural order.
    ((latC = a), (lonC = b));
  } else if (aAxis === "lon" || bAxis === "lat") {
    // a is longitude (or b is latitude) → input is in lon, lat order.
    ((latC = b), (lonC = a));
  } else {
    // No disambiguating information: assume first is latitude.
    orderAmbiguous = true;
    if (assumptions.swapLatLon) ((latC = b), (lonC = a));
    else ((latC = a), (lonC = b));
  }

  for (const c of [latC, lonC]) {
    if (c.hemisphere && c.hadSign) {
      warnings.push(
        "A value has both a sign and a hemisphere letter; using the letter.",
      );
    }
  }

  return {
    coordinate: {
      lat: signedValue(latC, "lat"),
      lon: signedValue(lonC, "lon"),
      latStepDeg: latC.stepDeg,
      lonStepDeg: lonC.stepDeg,
    },
    orderAmbiguous,
    latSpan: latC.span,
    lonSpan: lonC.span,
  };
}

/** Infer the axis a component must belong to from letters or magnitude. */
function axisOf(c: RawComponent): "lat" | "lon" | undefined {
  if (c.hemisphere === "N" || c.hemisphere === "S") return "lat";
  if (c.hemisphere === "E" || c.hemisphere === "W") return "lon";
  if (c.magnitude > 90) return "lon"; // latitude can't exceed 90
  return undefined;
}

function rangeWarnings(coord: Coordinate): {
  list: string[];
  fatal?: string;
} {
  const list: string[] = [];
  if (Math.abs(coord.lat) > 90) {
    return { list, fatal: `Latitude ${coord.lat} is out of range (-90…90).` };
  }
  if (Math.abs(coord.lon) > 180) {
    return {
      list,
      fatal: `Longitude ${coord.lon} is out of range (-180…180).`,
    };
  }
  if (Math.abs(coord.lon) > 90 && Math.abs(coord.lat) <= 90) {
    // fine, just informative that order is certain
  }
  return { list };
}
