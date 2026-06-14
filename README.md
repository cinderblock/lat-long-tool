# Latitude / Longitude Tool

Paste a latitude/longitude in almost any format and instantly get every
format, precision statistics, and one-click links into popular map services.
Everything runs locally in the browser — no coordinates are ever sent anywhere.

## Features

- **Forgiving parser** — accepts decimal degrees, degrees-decimal-minutes (DDM),
  degrees-minutes-seconds (DMS), hemisphere letters (`N/S/E/W`) as prefix or
  suffix, signed values, `geo:` URIs, and Google Maps / OpenStreetMap URLs.
- **Every standard format** — Decimal Degrees, DD + hemisphere, DDM, DMS,
  plain CSV, `geo:` URI, **Plus Code** (Open Location Code), **Geohash**,
  **Maidenhead** locator, **UTM**, and **MGRS**.
- **Ambiguity handling** — when the lat/lon order can't be inferred, a checkbox
  lets you pick the interpretation; values over 90° auto-resolve to longitude.
- **Precision estimate** — derives the ground resolution implied by how many
  digits you typed (e.g. 6 decimal places ≈ 11 cm).
- **Stats** — hemispheres, antipode, per-axis resolution.
- **Open in maps** — Google Maps, Apple Maps, OpenStreetMap, Bing, Google Earth,
  Waze, geohash.org, and Caltopo, each using that service's own URL format.

## Stack

- **React 19** + **React Router 7** (SPA, fully pre-rendered)
- **Vite 8** + **TypeScript 6** (strict)
- **Bun** — package manager and runtime
- **Playwright** — end-to-end tests
- **oxfmt** + **lefthook** — formatting and pre-commit hooks
- **GitHub Pages** — deployment via GitHub Actions

All coordinate math (parsing, OLC, geohash, Maidenhead, UTM/MGRS) is implemented
from scratch with no runtime dependencies.

## Getting started

```sh
bun install
bun run dev
```

## Scripts

| Script              | Description                 |
| ------------------- | --------------------------- |
| `bun run dev`       | Start dev server            |
| `bun run build`     | Build the static site       |
| `bun run preview`   | Preview the built site      |
| `bun run test`      | Run Playwright tests        |
| `bun run typecheck` | Type check                  |
| `bun run fmt`       | Format all files with oxfmt |

## Project structure

```
app/
  lib/coords/        — coordinate engine (no dependencies)
    parse.ts         — the forgiving input parser
    format.ts        — DD / DDM / DMS / geo URI formatting
    olc.ts           — Open Location Code (Plus Codes)
    geohash.ts       — geohash encoder
    maidenhead.ts    — Maidenhead grid locator
    utm.ts           — UTM projection + MGRS
    precision.ts     — resolution / distance helpers
    links.ts         — map-service links
  components/        — Tool + CopyButton UI
  routes/            — home + 404 pages
tests/               — Playwright end-to-end tests
```

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds, tests, and deploys to GitHub Pages on
every push to `master`.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment**
and set the **Source** to **GitHub Actions**.

The site is served from `https://<owner>.github.io/<repo>/`. The base path is
derived automatically from the repository name (passed as `VITE_BASE` during the
CI build), so no manual configuration is needed. If you use a custom domain or a
`<owner>.github.io` user/org repo, the base path is `/` — remove the `VITE_BASE`
env from the build step.
