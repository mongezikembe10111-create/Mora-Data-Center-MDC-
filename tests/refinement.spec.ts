import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("participation gap separates estimated residents from the documented electorate", async ({
  page,
}) => {
  await page.goto("/");
  const gap = page.locator("#participation-gap");
  await gap.scrollIntoViewIfNeeded();
  await expect(gap.getByLabel("Gap population basis")).toHaveValue(
    "voting-age",
  );
  await expect(gap.locator("tbody")).toContainText(
    /12[\s\u00a0]270[\s\u00a0]729/,
  );
  await expect(gap.locator("tbody")).toContainText(
    /14[\s\u00a0]239[\s\u00a0]459/,
  );
  await gap.getByLabel("Gap population basis").selectOption("electorate");
  await expect(gap.locator("tbody tr")).toHaveCount(2);
  const downloadPromise = page.waitForEvent("download");
  await gap
    .getByRole("button", { name: "Download gap calculation CSV ↓" })
    .click();
  const csv = await readFile((await (await downloadPromise).path())!, "utf8");
  expect(csv).toContain("14239459");
  expect(csv).toContain("electorate");
  expect(csv).toContain("Geography");
  expect(csv).toContain("South Africa");
  await page.locator("#global-province").selectOption("Gauteng");
  await expect(
    gap
      .getByLabel("Gap population basis")
      .locator('option[value="voting-age"]'),
  ).toHaveJSProperty("disabled", true);
  await expect(gap.locator(".data-notice").first()).toContainText(
    "does not have a compatible",
  );
  await page.locator("#hero-year").selectOption("2016");
  await expect(gap.locator("tbody")).toContainText(
    /2[\s\u00a0]629[\s\u00a0]892/,
  );
  const provinceDownloadPromise = page.waitForEvent("download");
  await gap
    .getByRole("button", { name: "Download gap calculation CSV ↓" })
    .click();
  const provinceDownload = await provinceDownloadPromise;
  expect(provinceDownload.suggestedFilename()).toContain("2016-gauteng");
  const provinceCsv = await readFile((await provinceDownload.path())!, "utf8");
  expect(provinceCsv).toContain("Gauteng");
  expect(provinceCsv).toContain("2629892");
});

test("published age turnout works in comparison and remains unavailable for 2026", async ({
  page,
}) => {
  await page.goto(
    "/comparison?mode=ages&metric=turnout&ageYearA=2016&ageYearB=2016",
  );
  await expect(page.locator(".election-chart svg").first()).toBeVisible();
  await expect(page.locator("tbody").first()).toContainText("71%");
  await expect(page.locator("tbody").first()).toContainText("50%");
  await expect(page.locator("tbody").first()).toContainText(/21/);
  const references = page
    .getByRole("combobox")
    .filter({ has: page.locator('option[value="2026"]') });
  await references.first().selectOption("2026");
  await expect(
    page.locator(".election-chart").getByRole("heading", {
      name: "Official comparable data unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(references.first()).toHaveValue("2026");
});
