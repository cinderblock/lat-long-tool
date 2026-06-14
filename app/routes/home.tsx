import type { MetaFunction } from "react-router";
import { Tool } from "~/components/Tool";

// Absolute site URL (for canonical / Open Graph). Overridable at build time.
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ??
  "https://cinderblock.github.io/lat-long-tool/"
).replace(/\/?$/, "/");
const OG_IMAGE = `${SITE_URL}og.png`;

export const meta: MetaFunction = () => {
  const title =
    "Latitude / Longitude Tool — paste any coordinate, get every format";
  const description =
    "Paste latitude & longitude in almost any format (DD, DMS, DDM, geo URI, map URLs) and instantly get decimal degrees, DMS, Plus Codes, geohash, Maidenhead, UTM, MGRS, precision estimates, and map links. Free and runs entirely in your browser.";
  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content:
        "latitude longitude converter, coordinate converter, DMS to decimal, decimal to DMS, plus code, geohash, MGRS, UTM, maidenhead locator, lat long parser",
    },
    { tagName: "link", rel: "canonical", href: SITE_URL },

    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Latitude / Longitude Tool" },
    { property: "og:url", content: SITE_URL },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },

    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Latitude / Longitude Tool",
        url: SITE_URL,
        description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "Decimal degrees (DD)",
          "Degrees decimal minutes (DDM)",
          "Degrees minutes seconds (DMS)",
          "Plus Code (Open Location Code)",
          "Geohash",
          "Maidenhead locator",
          "UTM",
          "MGRS",
          "Precision / resolution estimate",
          "Map service links",
        ],
      },
    },
  ];
};

export default function Home() {
  return (
    <main className="container">
      <header className="page-header">
        <h1>Latitude / Longitude Tool</h1>
        <p className="subtitle">
          Paste coordinates in almost any format — get every standard format,
          precision estimates, and map links.
        </p>
      </header>
      <Tool />
      <footer className="page-footer">
        <p>
          All parsing and conversion runs locally in your browser. The optional
          map preview is the only feature that loads external data (map tiles),
          and only after you enable it.
        </p>
      </footer>
    </main>
  );
}
