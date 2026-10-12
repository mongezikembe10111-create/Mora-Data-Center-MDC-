import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  // Stable South African afternoon: the General Finance noon deadline has passed.
  await page.clock.setFixedTime(new Date("2026-10-12T13:00:00+02:00"));
});

test("participation filters restore from a link, export source-aware notices and retain hearing opportunities", async ({
  page,
}) => {
  await page.goto(
    "/participation?q=Fiscal+Framework&sphere=national&kind=hearing&status=open&view=all",
  );
  await expect(page.getByLabel("Search notices")).toHaveValue(
    "Fiscal Framework",
  );
  await expect(page.getByLabel("Sphere of government")).toHaveValue("national");
  await expect(page.getByLabel("Participation type")).toHaveValue("hearing");
  await expect(page.getByLabel("Notice status")).toHaveValue("open");
  await expect(page.locator(".civic-notice-card")).toHaveCount(1);
  await expect(page.locator(".civic-notice-card")).toContainText(
    "2026 Revised Fiscal Framework and Revenue Proposals",
  );
  await expect(page.locator(".civic-notice-card")).toContainText(
    "26 October 2026",
  );
  await expect(page.locator(".civic-notice-card")).toContainText("12:00 SAST");
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download notices CSV" }).click();
  const csv = await csvDownload;
  const content = await readFile((await csv.path())!, "utf8");
  expect(content).toContain(
    "https://www.parliament.gov.za/committee-notice-details/999",
  );
  expect(content).toContain("2026-10-26");
  expect(content).toContain("12:00 SAST");
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.getByLabel("Search notices")).toHaveValue("");
  await page.getByLabel("Participation type").selectOption("hearing");
  const financeCard = page
    .locator(".civic-notice-card")
    .filter({
      has: page.getByRole("heading", {
        name: "General Finance Laws Amendment Bill [B21–2026]",
      }),
    });
  await expect(financeCard).toContainText("Submissions closed");
  await expect(financeCard).toContainText("13 October 2026");
  await page
    .getByLabel("Search notices")
    .fill("no-notice-matches-this-fixture");
  await expect(
    page.getByRole("heading", { name: "No verified notices match this view." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download notices CSV" }),
  ).toBeDisabled();
});

test("verified deadlines download with their real time and local submission drafts stay unsent", async ({
  page,
}) => {
  const errors: string[] = [];
  const posts: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/participation/fiscal-framework-2026");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "2026 Revised Fiscal Framework and Revenue Proposals",
  );
  const calendarDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Add deadline to calendar", exact: true })
    .click();
  const calendar = await calendarDownload;
  const calendarContent = await readFile((await calendar.path())!, "utf8");
  expect(calendarContent).toContain("DTSTART:20261026T100000Z");
  expect(calendarContent).toContain(
    "https://www.parliament.gov.za/committee-notice-details/999",
  );
  expect(calendarContent).not.toContain("DTEND");
  await page
    .getByLabel("Which issue, clause or page are you addressing?")
    .fill(
      "The proposed revenue measure needs a clear account of its household impact.",
    );
  await page
    .getByLabel("What change do you recommend?")
    .fill(
      "Publish a transparent distributional assessment alongside the proposed change.",
    );
  await page
    .getByLabel("What reasons or evidence support your recommendation?")
    .fill(
      "A published assessment would allow residents to evaluate the costs and benefits with evidence.",
    );
  const draftDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download unsent submission draft" })
    .click();
  const draft = await draftDownload;
  const draftContent = await readFile((await draft.path())!, "utf8");
  expect(draftContent).toContain("UNSENT DRAFT");
  expect(draftContent).toContain("transparent distributional assessment");
  expect(draftContent).toContain("This draft has not been sent.");
  expect(draftContent).toContain("2026-10-26, 12:00 SAST");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Draft downloaded to your device" }),
  ).toBeVisible();
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
});

test("citizen routes expose real registration and free PMG sources without overflow or serious accessibility violations", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const route of [
    "/participation",
    "/bills",
    "/participation/general-finance-laws-2026",
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
        .filter(
          (violation) =>
            violation.impact === "serious" || violation.impact === "critical",
        )
        .map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
    ).toEqual([]);
  }
  await page.goto("/participation#pmg-resources");
  await expect(page.locator("#pmg-resources")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Subscribe to free PMG updates" }),
  ).toHaveAttribute("href", "https://pmg.org.za/email-alerts/");
  await expect(
    page.getByRole("link", { name: "Register to vote with the IEC" }),
  ).toHaveAttribute("href", /registertovote\.elections\.org\.za/);
  await expect(
    page.getByRole("link", { name: "Open municipal directory" }),
  ).toHaveAttribute("href", "/municipalities");
  await page.goto("/participation/general-finance-laws-2026");
  await expect(page.locator(".civic-hero")).toContainText(
    "Submission window closed",
  );
  await expect(
    page.getByRole("button", { name: "Add deadline to calendar", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add event day to calendar" }),
  ).toBeVisible();
});
