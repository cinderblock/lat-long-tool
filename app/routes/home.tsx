import type { MetaFunction } from "react-router";
import { Tool } from "~/components/Tool";

export const meta: MetaFunction = () => {
  const title = "Lat / Long Tool — paste any coordinate, get every format";
  const description =
    "Paste latitude & longitude in almost any format (DD, DMS, DDM, geo URI, map URLs) and instantly get decimal degrees, DMS, Plus Codes, geohash, Maidenhead, UTM, MGRS, precision estimates, and map links.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
};

export default function Home() {
  return (
    <main className="container">
      <header className="page-header">
        <h1>Lat / Long Tool</h1>
        <p className="subtitle">
          Paste coordinates in almost any format — get every standard format,
          precision estimates, and map links.
        </p>
      </header>
      <Tool />
      <footer className="page-footer">
        <p>
          Everything runs locally in your browser. Nothing is sent anywhere.
        </p>
      </footer>
    </main>
  );
}
