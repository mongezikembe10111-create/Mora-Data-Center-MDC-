import { expect, test, type Locator, type Page } from "@playwright/test";
import { inflateSync } from "node:zlib";

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page) ?? []).toEqual([]);
});

// Inspect the actual composited frame. A working label/selector UI alone did
// not catch MapLibre's silent worker failure, which left every polygon blank.
// Chromium screenshots use 8-bit RGB/RGBA PNG; decode with Node's built-ins.
function colouredPixels(
  png: Buffer,
  matches: (red: number, green: number, blue: number) => boolean,
) {
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png[24]).toBe(8);
  expect([2, 6]).toContain(png[25]);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const channels = png[25] === 2 ? 3 : 4;
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") {
      chunks.push(png.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }
  const decoded = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  expect(decoded.length).toBe(height * (stride + 1));
  let previous = Buffer.alloc(stride);
  let offset = 0;
  let count = 0;
  let edgeCount = 0;
  for (let y = 0; y < height; y++) {
    const filter = decoded[offset++];
    if (filter > 4) throw new Error(`Unexpected PNG filter ${filter}`);
    const row = Buffer.alloc(stride);
    for (let byte = 0; byte < stride; byte++) {
      const left = byte >= channels ? row[byte - channels] : 0;
      const up = previous[byte];
      const upperLeft = byte >= channels ? previous[byte - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const prediction = left + up - upperLeft;
        const a = Math.abs(prediction - left);
        const b = Math.abs(prediction - up);
        const c = Math.abs(prediction - upperLeft);
        predictor = a <= b && a <= c ? left : b <= c ? up : upperLeft;
      }
      row[byte] = (decoded[offset++] + predictor) & 255;
    }
    for (let x = 0; x < width; x++) {
      const pixel = x * channels;
      if (matches(row[pixel], row[pixel + 1], row[pixel + 2])) {
        count++;
        if (x < 8 || y < 8 || x >= width - 8 || y >= height - 8) edgeCount++;
      }
    }
    previous = row;
  }
  return { count, edgeCount };
}

const purple = (r: number, g: number, b: number) =>
  r > 35 && g > 25 && r > g + 5 && b > r + 10 && b > g + 20;
const lime = (r: number, g: number, b: number) =>
  g > 60 && g > r + 15 && g > b + 20;

function explorer(page: Page) {
  return page.getByRole("region", {
    name: "The electoral landscape",
    exact: true,
  });
}

async function chooseCouncil(map: Locator, province: string, code: string) {
  await map.getByLabel("Province", { exact: true }).selectOption(province);
  const council = map.getByLabel("Municipality", { exact: true });
  await expect(council).toBeEnabled();
  await council.selectOption(code);
  await expect(map.getByLabel("Ward", { exact: true })).toBeEnabled();
}

test("native map draws province and ward polygons, fits small and wide canvases, and keeps source gaps explicit", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const workerResponse = page.waitForResponse((response) =>
    response.url().endsWith("/vendor/maplibre/maplibre-gl-worker.mjs"),
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/map");
    const map = explorer(page);
    const stage = map.locator(".electoral-map-stage");
    await expect(
      map.getByRole("button", { name: "Zoom in", exact: true }),
    ).toBeEnabled();
    await expect(map.locator(".electoral-map-svg")).toHaveCount(0);
    await expect
      .poll(async () => colouredPixels(await stage.screenshot(), purple).count)
      .toBeGreaterThan(250);
    expect(
      colouredPixels(await stage.screenshot(), purple).edgeCount,
    ).toBeLessThan(15);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    expect(
      await map.evaluate((element) => {
        const bounds = element
          .querySelector(".electoral-map-stage")!
          .getBoundingClientRect();
        return [...element.querySelectorAll(".province-map-label")].every(
          (label) => {
            const rect = label.getBoundingClientRect();
            return (
              !rect.width ||
              (rect.left >= bounds.left &&
                rect.top >= bounds.top &&
                rect.right <= bounds.right &&
                rect.bottom <= bounds.bottom)
            );
          },
        );
      }),
    ).toBe(true);
  }
  expect((await workerResponse).status()).toBe(200);
  const map = explorer(page);
  await map
    .getByRole("button", { name: "Explore Western Cape wards", exact: true })
    .click();
  await expect(map.getByLabel("Municipality", { exact: true })).toBeEnabled();
  await map.getByLabel("Municipality", { exact: true }).selectOption("CPT");
  await map.getByLabel("Ward", { exact: true }).selectOption("19100001");
  await expect(map.locator(".map-geography-card")).toContainText(
    "Ward identifier: 19100001",
  );
  await expect
    .poll(
      async () =>
        colouredPixels(
          await map.locator(".electoral-map-stage").screenshot(),
          lime,
        ).count,
    )
    .toBeGreaterThan(250);
  await expect(map.locator(".map-geography-card")).toContainText(
    "Verified ward election statistics are not yet included",
  );
  await expect(map.locator(".map-geography-card")).not.toContainText(
    /registered voters|turnout|participating voters/i,
  );
  await map
    .getByRole("button", { name: "Back one level", exact: true })
    .click();
  await expect(map.getByLabel("Ward", { exact: true })).toHaveValue("");
  await map
    .getByRole("button", { name: "Back one level", exact: true })
    .click();
  await expect(map.getByLabel("Municipality", { exact: true })).toHaveValue("");
  await map
    .getByRole("button", { name: "Back one level", exact: true })
    .click();
  await expect(map.getByLabel("Province", { exact: true })).toHaveValue("");
  await chooseCouncil(map, "Gauteng", "GT484");
  await expect(map.locator(".map-coverage-warning")).toContainText(/8, 19, 27/);
  const wardNumbers = await map
    .getByLabel("Ward", { exact: true })
    .locator("option")
    .allTextContents();
  expect(wardNumbers.some((label) => /^Ward (8|19|27) ·/.test(label))).toBe(
    false,
  );
  await expect(map.locator(".map-source-note")).toContainText(
    "4,488 wards and 214 municipalities",
  );
  await expect(map.locator(".map-source-note")).toContainText(
    "has not been reconciled",
  );
  await map.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(map.getByLabel("Province", { exact: true })).toHaveValue("");
});

test("SVG fallback supports province keyboard activation, council and ward selection, zoom and breadcrumbs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/map");
  const map = explorer(page);
  await expect(map.locator(".electoral-map-svg")).toBeVisible();
  const province = map.getByRole("button", {
    name: "Select Gauteng",
    exact: true,
  });
  await province.focus();
  await page.keyboard.press("Enter");
  await expect(map.getByLabel("Municipality", { exact: true })).toBeEnabled();
  await map.getByLabel("Municipality", { exact: true }).selectOption("TSH");
  await map.getByLabel("Ward", { exact: true }).selectOption("79900001");
  await expect(map.locator(".ward-shape.selected")).toHaveAttribute(
    "aria-label",
    "Ward 1, City of Tshwane",
  );
  await map.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(map.locator(".electoral-map-svg > g")).toHaveAttribute(
    "transform",
    /scale\(1\.5\)/,
  );
  // Clicking the top-right zoom button can leave a desktop ward's centre just
  // below the viewport. Mouse coordinates must target visible map geometry.
  await map.locator(".electoral-map-svg").scrollIntoViewIfNeeded();
  const beforePan = await map
    .locator(".electoral-map-svg > g")
    .getAttribute("transform");
  const shape = await map.locator(".ward-shape.selected").boundingBox();
  expect(shape).not.toBeNull();
  await page.mouse.move(
    shape!.x + shape!.width / 2,
    shape!.y + shape!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    shape!.x + shape!.width / 2 + 30,
    shape!.y + shape!.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect
    .poll(() => map.locator(".electoral-map-svg > g").getAttribute("transform"))
    .not.toBe(beforePan);
  await expect(map.getByLabel("Ward", { exact: true })).toHaveValue("79900001");
  await map.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(map.locator(".electoral-map-svg > g")).toHaveAttribute(
    "transform",
    /scale\(1\)/,
  );
  await map
    .getByRole("navigation", { name: "Map location" })
    .getByRole("button", { name: "Gauteng", exact: true })
    .click();
  await expect(map.getByLabel("Municipality", { exact: true })).toHaveValue("");
  await expect(map.getByLabel("Ward", { exact: true })).toBeDisabled();
  await map.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(map.locator(".province-shape")).toHaveCount(9);
});

test("a failed ward asset offers a working retry while preserving the province context", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/data/wards/WC.geojson", (route) =>
    fail
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.continue(),
  );
  await page.goto("/map");
  const map = explorer(page);
  await map
    .getByLabel("Province", { exact: true })
    .selectOption("Western Cape");
  await expect(
    map.getByRole("button", { name: "Retry ward boundaries", exact: true }),
  ).toBeVisible();
  await expect(map.getByLabel("Municipality", { exact: true })).toBeDisabled();
  await expect(map.locator(".map-selection-card")).toContainText(
    "Western Cape",
  );
  await expect(map.locator(".map-selection-card")).toContainText(
    "Registered voters",
  );
  fail = false;
  await map
    .getByRole("button", { name: "Retry ward boundaries", exact: true })
    .click();
  await expect(map.getByLabel("Municipality", { exact: true })).toBeEnabled();
  await map.getByLabel("Municipality", { exact: true }).selectOption("CPT");
  await map.getByLabel("Ward", { exact: true }).selectOption("19100001");
  await expect(map.locator(".map-geography-card")).toContainText(
    "Ward identifier: 19100001",
  );
});

test("a silently blocked WebGL worker falls back to a usable SVG map", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.route("**/vendor/maplibre/maplibre-gl-worker.mjs", (route) =>
    route.abort(),
  );
  await page.goto("/map");
  const map = explorer(page);
  await expect(map.locator(".electoral-map-svg")).toBeVisible({
    timeout: 20_000,
  });
  await expect(map.locator(".province-shape")).toHaveCount(9);
  await chooseCouncil(map, "Western Cape", "CPT");
  await map.getByLabel("Ward", { exact: true }).selectOption("19100001");
  await expect(map.locator(".ward-shape.selected")).toHaveAttribute(
    "aria-label",
    "Ward 1, City of Cape Town",
  );
});
