// Generates the PWA / favicon PNGs with headless Chromium.
// Run with: bun run icons
import { chromium } from "playwright";

// `bleed` = true draws a full-bleed background (for maskable / apple-touch,
// where the OS applies its own rounded mask); false = rounded app-icon corners.
function svg(bleed) {
  const bg = bleed
    ? `<rect width="512" height="512" fill="#0f0f1a"/>`
    : `<rect width="512" height="512" rx="96" fill="#0f0f1a"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    ${bg}
    <circle cx="256" cy="256" r="150" fill="none" stroke="#3a3a52" stroke-width="12"/>
    <line x1="106" y1="256" x2="406" y2="256" stroke="#2dd4bf" stroke-width="14" stroke-linecap="round"/>
    <ellipse cx="256" cy="256" rx="64" ry="150" fill="none" stroke="#3b82f6" stroke-width="14"/>
    <circle cx="256" cy="256" r="20" fill="#f0f0f0"/>
  </svg>`;
}

const targets = [
  { file: "public/icon-192.png", size: 192, bleed: false },
  { file: "public/icon-512.png", size: 512, bleed: false },
  { file: "public/icon-maskable-512.png", size: 512, bleed: true },
  { file: "public/apple-touch-icon.png", size: 180, bleed: true },
];

const browser = await chromium.launch();
for (const { file, size, bleed } of targets) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>*{margin:0}html,body{width:${size}px;height:${size}px}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg(bleed)}</body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: file, omitBackground: false });
  await page.close();
  console.log(`Wrote ${file}`);
}
await browser.close();
