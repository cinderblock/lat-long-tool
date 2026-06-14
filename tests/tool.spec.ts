import { test, expect } from "@playwright/test";

const NYC = "40.748817, -73.985428";

test.describe("Latitude / Longitude Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for React to hydrate before interacting (controlled inputs ignore
    // changes until then).
    await page.locator("html[data-hydrated]").waitFor();
  });

  test("has descriptive title and heading", async ({ page }) => {
    await expect(page).toHaveTitle(/Latitude \/ Longitude Tool/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Latitude / Longitude Tool",
    );
  });

  test("shows examples when empty and hides them once a value is entered", async ({
    page,
  }) => {
    await expect(page.locator(".examples")).toBeVisible();
    await expect(page.locator(".results")).toHaveCount(0);
    await page.locator("#coord-input").fill(NYC);
    await expect(page.locator(".results")).toBeVisible();
    await expect(page.locator(".examples")).toHaveCount(0);
  });

  test("converts a decimal-degrees value to every format", async ({ page }) => {
    await page.locator("#coord-input").fill(NYC);
    const results = page.locator(".results");
    await expect(results).toContainText("40° 44.929′ N, 73° 59.126′ W"); // DDM
    await expect(results).toContainText("40° 44′ 55.74″ N, 73° 59′ 7.54″ W"); // DMS
    await expect(results).toContainText("geo:40.748817,-73.985428");
    await expect(results).toContainText("87G8P2X7+GRG"); // Plus Code
    await expect(results).toContainText("dr5ru6j7nd4"); // Geohash
    await expect(results).toContainText("18T WL 85650 11369"); // MGRS
    // Antipode is shown in an unambiguous hemisphere format.
    await expect(results).toContainText("40.748817° S, 106.014572° E");
  });

  test("highlights the latitude and longitude parts of the input", async ({
    page,
  }) => {
    await page.locator("#coord-input").fill(NYC);
    await expect(page.locator(".coord-backdrop .hl-lat")).toHaveText(
      "40.748817",
    );
    await expect(page.locator(".coord-backdrop .hl-lon")).toHaveText(
      "-73.985428",
    );
  });

  test("parses a DMS string and labels the format", async ({ page }) => {
    await page.locator("#coord-input").fill(`51°28'40.1"N 0°00'05.3"W`); // Greenwich
    await expect(page.locator(".format-badge")).toContainText("DMS");
    await expect(page.locator(".results")).toContainText("51.47781, -0.00147");
    await expect(page.locator(".assumption")).toHaveCount(0);
  });

  test("offers a swap assumption for ambiguous order and applies it", async ({
    page,
  }) => {
    await page.locator("#coord-input").fill("10, 20");
    const swap = page.getByRole("checkbox");
    await expect(swap).toBeVisible();
    await expect(page.locator(".results")).toContainText("10° N, 20° E");
    await swap.check();
    await expect(page.locator(".results")).toContainText("20° N, 10° E");
  });

  test("auto-resolves order when a value exceeds 90", async ({ page }) => {
    await page.locator("#coord-input").fill("-122.4194, 37.7749"); // lon first
    await expect(page.locator(".assumption")).toHaveCount(0);
    await expect(page.locator(".results")).toContainText(
      "37.7749° N, 122.4194° W",
    );
  });

  test("attaches a hemisphere letter to its own value (1,3S)", async ({
    page,
  }) => {
    await page.locator("#coord-input").fill("1,3S");
    await expect(page.locator(".results")).toContainText("3° S, 1° E");
    await expect(page.locator(".assumption")).toHaveCount(0);
  });

  test("shows an error for out-of-range input", async ({ page }) => {
    await page.locator("#coord-input").fill("200, 10");
    await expect(page.locator(".error")).toBeVisible();
    await expect(page.locator(".results")).toHaveCount(0);
  });

  test("builds correct map-service links", async ({ page }) => {
    await page.locator("#coord-input").fill(NYC);
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
    const w3w = page.getByRole("link", { name: /what3words/ });
    await expect(w3w).toHaveAttribute(
      "href",
      /what3words\.com\/.*center=40\.748817,-73\.985428/,
    );
  });

  test("clears the input with the clear button", async ({ page }) => {
    const input = page.locator("#coord-input");
    await input.fill(NYC);
    await expect(page.locator(".results")).toBeVisible();
    await page.getByRole("button", { name: "Clear input" }).click();
    await expect(input).toHaveValue("");
    await expect(page.locator(".results")).toHaveCount(0);
    await expect(page.locator(".examples")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("q")).toBeNull();
  });

  test("loading an example chip fills the input and updates the URL", async ({
    page,
  }) => {
    const chip = page.locator(".example-chip").first();
    const text = (await chip.textContent())!;
    await chip.click();
    await expect(page.locator("#coord-input")).toHaveValue(text);
    await expect(page.locator(".results")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("q")).toBe(text);
  });

  test("reads the coordinate from the q query parameter", async ({ page }) => {
    await page.goto(`/?q=${encodeURIComponent(NYC)}`);
    await page.locator("html[data-hydrated]").waitFor();
    await expect(page.locator("#coord-input")).toHaveValue(NYC);
    await expect(page.locator(".results")).toBeVisible();
  });
});
