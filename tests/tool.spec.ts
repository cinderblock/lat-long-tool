import { test, expect } from "@playwright/test";

test.describe("Lat / Long Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for React to hydrate before interacting (controlled inputs ignore
    // changes until then).
    await page.locator("html[data-hydrated]").waitFor();
  });

  test("has descriptive title and heading", async ({ page }) => {
    await expect(page).toHaveTitle(/Lat \/ Long Tool/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Lat / Long Tool",
    );
  });

  test("converts the default decimal-degrees example to every format", async ({
    page,
  }) => {
    const results = page.locator(".results");
    await expect(results).toContainText("40° 44.929′ N, 73° 59.126′ W"); // DDM
    await expect(results).toContainText("40° 44′ 55.74″ N, 73° 59′ 7.54″ W"); // DMS
    await expect(results).toContainText("geo:40.748817,-73.985428");
    await expect(results).toContainText("87G8P2X7+GRG"); // Plus Code
    await expect(results).toContainText("dr5ru6j7nd4"); // Geohash
    await expect(results).toContainText("18T WL 85650 11369"); // MGRS
  });

  test("parses a DMS string with hemisphere letters", async ({ page }) => {
    const input = page.getByRole("textbox");
    await input.fill(`51°28'40.1"N 0°00'05.3"W`); // Greenwich
    const results = page.locator(".results");
    await expect(results).toContainText("parsed as DMS");
    await expect(page.locator(".summary-main")).toContainText(
      "51.477806,-0.001472",
    );
    // Unambiguous input: no swap checkbox.
    await expect(page.locator(".assumption")).toHaveCount(0);
  });

  test("offers a swap assumption for ambiguous order and applies it", async ({
    page,
  }) => {
    const swap = page.getByRole("checkbox");
    await expect(swap).toBeVisible();
    await expect(page.locator(".summary-main")).toContainText(
      "40.748817,-73.985428",
    );
    await swap.check();
    await expect(page.locator(".summary-main")).toContainText(
      "-73.985428,40.748817",
    );
  });

  test("auto-resolves order when a value exceeds 90", async ({ page }) => {
    await page.getByRole("textbox").fill("-122.4194, 37.7749"); // lon first
    // 122 can only be longitude, so no ambiguity and lat is the 37 value.
    await expect(page.locator(".assumption")).toHaveCount(0);
    await expect(page.locator(".summary-main")).toContainText(
      "37.774900,-122.419400",
    );
  });

  test("shows an error for out-of-range input", async ({ page }) => {
    await page.getByRole("textbox").fill("200, 10");
    await expect(page.locator(".error")).toBeVisible();
    await expect(page.locator(".results")).toHaveCount(0);
  });

  test("builds correct map-service links", async ({ page }) => {
    const google = page.getByRole("link", { name: /Google Maps/ });
    await expect(google).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=40.748817,-73.985428",
    );
    const osm = page.getByRole("link", { name: /OpenStreetMap/ });
    await expect(osm).toHaveAttribute(
      "href",
      /openstreetmap\.org\/\?mlat=40\.748817&mlon=-73\.985428/,
    );
  });

  test("loads an example from the chips", async ({ page }) => {
    await page.getByRole("button", { name: "geo:48.8584,2.2945" }).click();
    await expect(page.locator(".summary-main")).toContainText(
      "48.858400,2.294500",
    );
    await expect(page.locator(".format-badge")).toContainText("geo");
  });
});
