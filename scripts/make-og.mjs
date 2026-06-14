// Generates public/og.png (1200×630 social preview) by screenshotting a
// styled card with headless Chromium. Run with: bun run scripts/make-og.mjs
import { chromium } from "playwright";

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    font-family: "Segoe UI", Roboto, system-ui, -apple-system, sans-serif;
    background: radial-gradient(120% 120% at 0% 0%, #1a1a2e 0%, #0f0f1a 55%);
    color: #f0f0f0;
    padding: 80px 90px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .eyebrow { font-size: 26px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8aa0; margin-bottom: 22px; }
  h1 { font-size: 84px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.02; }
  h1 .slash { color: #3b82f6; }
  p { font-size: 32px; color: #a0a0b0; margin-top: 26px; max-width: 60ch; }
  .pill {
    margin-top: 54px; display: inline-flex; align-items: center; gap: 4px;
    font-family: Consolas, 'Cascadia Mono', monospace; font-size: 38px; font-weight: 500;
    background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 16px; padding: 22px 30px;
    align-self: flex-start;
  }
  .lat { color: #f0f0f0; background: rgba(96,165,250,0.22); box-shadow: inset 0 -3px 0 #60a5fa; border-radius: 5px; padding: 2px 4px; }
  .lon { color: #f0f0f0; background: rgba(45,212,191,0.22); box-shadow: inset 0 -3px 0 #2dd4bf; border-radius: 5px; padding: 2px 4px; }
  .sep { color: #6a6a80; margin: 0 10px; }
  .formats { margin-top: 30px; font-size: 24px; color: #7a7a90; letter-spacing: 0.02em; }
</style></head>
<body>
  <div class="eyebrow">Latitude / Longitude</div>
  <h1>The coordinate <span class="slash">multi-tool</span></h1>
  <p>Paste any format — get decimal, DMS, Plus Code, geohash, UTM, MGRS, precision &amp; maps.</p>
  <div class="pill"><span class="lat">40.748817</span><span class="sep">,</span><span class="lon">-73.985428</span></div>
  <div class="formats">DD · DDM · DMS · geo: · Plus Code · Geohash · Maidenhead · UTM · MGRS</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("Wrote public/og.png");
