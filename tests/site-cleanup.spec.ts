import { expect, test } from "@playwright/test";

test("electoral controls and source notes fit a 320px screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const route of ["/overview", "/registration", "/explorer"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        })),
      )
      .toEqual({ viewport: 320, content: 320 });
  }
  await page.goto("/registration");
  await page.getByText("Accessible composition table", { exact: true }).click();
  const composition = page.getByRole("region", {
    name: "Published registration composition data",
  });
  await expect(composition).toHaveAttribute("tabindex", "0");
  await composition.focus();
  await expect(composition).toBeFocused();
});

test("search remains on screen and opens a matching page on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/overview");
  await page.getByRole("button", { name: "Search pages and datasets" }).click();
  const dialog = page.getByRole("dialog", { name: "Search The Public Square" });
  await expect(dialog).toBeVisible();
  const position = await dialog.boundingBox();
  expect(position).not.toBeNull();
  expect(position!.y).toBeGreaterThanOrEqual(16);
  expect(position!.y + position!.height).toBeLessThanOrEqual(553);
  await dialog
    .getByRole("textbox", { name: "Search", exact: true })
    .fill("municipalities");
  await dialog
    .getByRole("link", { name: "Municipalities", exact: true })
    .click();
  await expect(page).toHaveURL(/\/municipalities/);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("share controls expose a selected link when browser clipboard access is denied", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Clipboard access denied for this test");
        },
      },
    });
  });
  await page.goto("/comparison");
  await page.getByRole("button", { name: /Share comparison/ }).click();
  const comparisonLink = page.getByRole("textbox", {
    name: "Shareable comparison URL",
  });
  await expect(comparisonLink).toBeVisible();
  await expect(comparisonLink).toBeFocused();
  await expect(comparisonLink).toHaveValue(/\/comparison\?.*metric=turnout/);
  expect(
    await comparisonLink.evaluate(
      (input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!,
    ),
  ).toBe((await comparisonLink.inputValue()).length);

  await page.goto("/explorer");
  await page.getByRole("button", { name: /Copy permalink/ }).click();
  const chartLink = page.getByRole("textbox", { name: "Chart permalink" });
  await expect(chartLink).toBeVisible();
  await expect(chartLink).toBeFocused();
  await expect(chartLink).toHaveValue(/\/explorer\?.*metric=turnout/);
  expect(
    await chartLink.evaluate(
      (input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!,
    ),
  ).toBe((await chartLink.inputValue()).length);
});
