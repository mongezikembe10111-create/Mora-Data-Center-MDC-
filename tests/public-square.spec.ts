import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  // Fix the date so archived comment windows and forthcoming hearings stay distinct.
  await page.clock.setFixedTime(new Date("2026-10-12T13:00:00+02:00"));
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page) ?? []).toEqual([]);
});

test("The Public Square introduces the evidence and keeps each data preview in its own source period", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /A space to\s*question\s*power\./,
  );
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "The Public Square home" }),
  ).toBeVisible();
  const preview = page.getByRole("region", {
    name: "Explore South Africa’s electoral data",
  });
  const choices = preview.getByRole("group", { name: "Choose a data preview" });
  await expect(
    choices.getByRole("button", { name: "Participation", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toContainText("14.24M");
  await expect(preview).toContainText("2021 municipal election");
  await expect(preview.getByRole("img")).toHaveAccessibleName(
    /14[\s\u00a0]239[\s\u00a0]459 did not vote.*12[\s\u00a0]063[\s\u00a0]709 participated/,
  );

  await choices
    .getByRole("button", { name: "Registration", exact: true })
    .click();
  await expect(preview).toContainText("29.23M");
  await expect(preview).toContainText("29 September 2026 snapshot");
  await expect(preview).toContainText("Gauteng");
  await expect(preview).toContainText("Registration is a count, not turnout");
  await expect(
    preview.getByRole("link", { name: "Explore voter registration" }),
  ).toHaveAttribute("href", "/registration");

  await choices.getByRole("button", { name: "Youth", exact: true }).click();
  await expect(preview).toContainText(
    "Published turnout among registered 20–29 year olds in 2016.",
  );
  await expect(preview).toContainText(
    "2016 municipal election · rounded rates",
  );
  await expect(preview).toContainText(
    "they do not describe youth participation in 2026",
  );
  await expect(preview.getByRole("listitem")).toHaveCount(8);
  await expect(preview.getByRole("listitem").first()).toContainText("71%");
  await expect(preview.getByRole("listitem").nth(1)).toContainText("50%");
  await expect(
    preview.getByRole("link", { name: "Open the youth intelligence lab" }),
  ).toHaveAttribute("href", "/youth");
  await page
    .getByRole("link", { name: "Explore the data", exact: true })
    .click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "South Africa’s democracy",
  );
  await page
    .getByRole("banner")
    .getByRole("link", { name: "The Public Square home" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "question",
  );
});

test("homepage participation filters distinguish upcoming events from provincial source records", async ({
  page,
}) => {
  await page.goto("/");
  const opportunities = page.locator("#participation-now");
  await page.getByRole("link", { name: "Find ways to participate" }).click();
  await expect(page).toHaveURL(/#participation-now$/);
  const filters = opportunities.getByRole("group", {
    name: "Filter participation opportunities by government sphere",
  });

  await filters.getByRole("button", { name: "National", exact: true }).click();
  const nationalCards = opportunities.getByRole("article");
  await expect(nationalCards).toHaveCount(4);
  await expect(nationalCards.first()).toContainText("national");
  const finance = nationalCards.filter({
    has: page.getByRole("heading", {
      name: "General Finance Laws Amendment Bill [B21–2026]",
    }),
  });
  await expect(finance).toContainText("Comments closed");
  await expect(finance).toContainText("Hearing upcoming");
  await expect(finance).toContainText("13 October 2026");
  await expect(
    opportunities.getByRole("link", { name: "Browse participation hub" }),
  ).toHaveAttribute("href", "/participation?sphere=national");

  await filters.getByRole("button", { name: "Municipal", exact: true }).click();
  const municipalCards = opportunities.getByRole("article");
  await expect(municipalCards).toHaveCount(4);
  await expect(municipalCards.first()).toContainText("municipal");
  await expect(municipalCards.first()).toContainText("25 October 2026");
  await expect(
    opportunities.getByRole("link", { name: "Browse participation hub" }),
  ).toHaveAttribute("href", "/participation?sphere=municipal");

  await filters
    .getByRole("button", { name: "Provincial", exact: true })
    .click();
  await expect(opportunities).toContainText(
    "No upcoming dated opportunity is verified in this selection",
  );
  await expect(opportunities.getByRole("article").first()).toContainText(
    "provincial",
  );
  await expect(
    opportunities.getByRole("link", { name: "Browse participation hub" }),
  ).toHaveAttribute("href", "/participation?sphere=provincial&view=all");
  await opportunities
    .getByRole("link", { name: "Browse participation hub" })
    .click();
  await expect(page).toHaveURL(/\/participation\?sphere=provincial&view=all$/);
  await expect(page.getByLabel("Sphere of government")).toHaveValue(
    "provincial",
  );
});

test("municipal lookup finds Makana by its code and carries that result into the complete directory", async ({
  page,
}) => {
  await page.goto("/");
  const finder = page.getByRole("search", { name: "Find your municipality" });
  const search = finder.getByRole("searchbox", {
    name: "Search a municipality, province or municipal code",
  });
  await search.fill("no-such-municipality-xyz");
  await expect(
    page.getByText("No matching municipality.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toHaveValue("");
  await search.fill("EC104");
  await expect(
    page.getByText("1 municipality found", { exact: true }),
  ).toBeVisible();
  const result = page.getByRole("link", {
    name: /Makana.*Eastern Cape.*EC104/,
  });
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("href", "/municipalities?q=EC104");
  await result.click();
  await expect(page).toHaveURL(/\/municipalities\?q=EC104$/);
  await expect(page.getByRole("searchbox")).toHaveValue("EC104");
  await expect(
    page
      .getByRole("region", { name: "Municipal directory results" })
      .getByRole("article"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Makana Local Municipality" }),
  ).toBeVisible();
});

test("homepage remains accessible with reduced motion and mobile navigation contains keyboard focus", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const finalCall = page.getByRole("heading", {
    name: /Stay informed.\s*Make your voice count./,
  });
  await finalCall.scrollIntoViewIfNeeded();
  await expect(finalCall).toBeVisible();
  const animations = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running").length,
  );
  expect(animations).toBe(0);
  await expect(
    page.getByRole("link", { name: "Register to vote", exact: true }),
  ).toHaveAttribute("href", "https://registertovote.elections.org.za/");
  await expect(
    page.getByRole("link", {
      name: "Subscribe to free PMG updates",
      exact: true,
    }),
  ).toHaveAttribute("href", "https://pmg.org.za/email-alerts/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);

  if (isMobile) {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    const menu = page.getByRole("dialog", {
      name: "Explore The Public Square",
    });
    await expect(menu).toBeVisible();
    const focusables = menu.getByRole("link");
    await focusables.last().focus();
    await page.keyboard.press("Tab");
    await expect(
      menu.getByRole("button", { name: "Close navigation" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(focusables.last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Toggle navigation" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page
      .getByRole("navigation", { name: "Mobile", exact: true })
      .getByRole("link", { name: "Bills", exact: true })
      .click();
    await expect(page).toHaveURL(/\/bills$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("banner")
      .getByRole("link", { name: "The Public Square home" })
      .click();
  }
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "question",
  );
  await expect(page).toHaveTitle(
    "The Public Square — A space to question power.",
  );
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
        targets: violation.nodes.map((node) => node.target),
      })),
  ).toEqual([]);
});
