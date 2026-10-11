import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
test("page navigation, search, and main landmark work with a keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".chart-space").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".chart-space svg").first()).toBeVisible();
  await page.getByRole("button", { name: "Search pages and datasets" }).click();
  await page
    .getByRole("textbox", { name: "Search", exact: true })
    .fill("turnout");
  await page
    .getByRole("link", { name: "The turnout denominator matters" })
    .click();
  await expect(page).toHaveURL(/research\/the-turnout-denominator/);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "denominator",
  );
});
test("explorer can move between data and empty states without breaking its chart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/explorer");
  await expect(page.locator(".election-chart svg").first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Province", exact: true })
    .selectOption("Gauteng");
  await page
    .getByRole("combobox", { name: "Reference year", exact: true })
    .selectOption("2021");
  await expect(
    page.locator(".election-chart").getByRole("heading", {
      name: "Official comparable data unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Reset filters/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(page.locator(".election-chart svg").first()).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download CSV ↓", exact: true })
    .click();
  const download = await downloadPromise;
  const content = await readFile((await download.path())!, "utf8");
  expect(content).toContain("Electoral Commission");
  expect(content).toContain("Variable definition");
  expect(content).toContain("Reference");
  expect(errors).toEqual([]);
});
test("comparison links restore selections and unsupported groups stay explicit", async ({
  page,
}) => {
  await page.goto(
    "/comparison?mode=provinces&provinceA=Gauteng&provinceB=Western+Cape&metric=turnout",
  );
  await expect(page.getByLabel("Compare by")).toHaveValue("provinces");
  await expect(page.locator("tbody")).toContainText("57.91%");
  await expect(page.locator("tbody")).toContainText("63.46%");
  await page.getByLabel("Compare by").selectOption("metros");
  await expect(
    page.locator(".election-chart").getByRole("heading", {
      name: "Official comparable data unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Compare by").selectOption("years");
  await expect(page.locator(".election-chart svg").first()).toBeVisible();
});
test("scenario population changes compare with the fixed illustrative baseline", async ({
  page,
}) => {
  await page.goto("/youth");
  await page.locator(".chart-space").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".chart-space svg").first()).toBeVisible();
  const scenario = page.locator("#scenario-lab");
  await expect(
    scenario.locator(".scenario-output .metric-number"),
  ).toContainText("3");
  await page.locator("#eligible-youth").focus();
  await page.locator("#eligible-youth").press("End");
  await expect(
    scenario.locator(".scenario-output .metric-number"),
  ).toContainText("6");
  await expect(scenario.locator(".scenario-stats")).toContainText(/\+3[.,]3M/);
  await page.getByRole("button", { name: "Reset assumptions" }).click();
  await expect(page.locator("#eligible-youth")).toHaveValue("10");
});
test("core routes have no horizontal overflow or serious accessibility violations", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/explorer",
    "/research/the-turnout-denominator",
    "/contact",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({
          id: v.id,
          help: v.help,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            html: n.html,
            summary: n.failureSummary,
          })),
        })),
    ).toEqual([]);
  }
});

test("registration composition charts preserve real category totals and compatible flows", async ({
  page,
}) => {
  await page.goto("/registration");
  const composition = page.locator("#composition-studio");
  await expect(
    composition.locator(".election-chart svg").first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Composition chart", exact: true })
    .selectOption("donut");
  await expect(
    composition.locator(".election-chart svg").first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Composition chart", exact: true })
    .selectOption("treemap");
  await page
    .getByRole("combobox", { name: "Break down by", exact: true })
    .selectOption("province");
  await composition
    .getByText("Accessible composition table", { exact: true })
    .click();
  await expect(composition.locator("tbody tr")).toHaveCount(9);
  await expect(composition.locator("tbody")).toContainText("Gauteng");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Composition CSV ↓", exact: true })
    .click();
  const csv = await readFile((await (await downloadPromise).path())!, "utf8");
  expect(csv).toContain("29 September 2026");
  expect(csv).toContain("6751064");
  await page
    .getByRole("combobox", { name: "Flow election", exact: true })
    .selectOption("2016");
  await expect(page.locator("#participation-sankey tbody")).toContainText(
    /15[\s\u00a0]290[\s\u00a0]820/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
