import { expect, test } from "@playwright/test";

test("submission contacts expose the correct people and copy an address without opening a mail app", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/participation/fiscal-framework-2026");
  const contacts = page.locator(".civic-contact-card");
  await expect(contacts).toHaveCount(3);
  await expect(contacts.nth(0)).toContainText("Mr Allen Wicomb");
  await expect(contacts.nth(1)).toContainText("Ms Lwazikazi Ntinzi");
  await expect(contacts.nth(2)).toContainText("Mr Nkululeko Mangweni");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Copy email address awicomb@parliament.gov.za",
      exact: true,
    })
    .click();
  await expect(page.locator(".civic-contact-status")).toContainText(
    "Copied awicomb@parliament.gov.za",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "awicomb@parliament.gov.za",
  );
  await expect(page).toHaveURL(/\/participation\/fiscal-framework-2026/);
});

test("copy survives denied clipboard permissions and long municipal addresses fit a small phone", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard permission denied");
        },
      },
      configurable: true,
    });
  });
  await page.goto("/participation/fiscal-framework-2026");
  await page
    .getByRole("button", {
      name: "Copy email address lntinzi@parliament.gov.za",
      exact: true,
    })
    .click();
  await expect(page.locator(".civic-contact-status")).toContainText(
    "Copied lntinzi@parliament.gov.za",
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/participation/cape-town-ward-committee-rules-2026");
  await expect(page.locator(".civic-contact-panel")).toContainText(
    "Use the official participation form",
  );
  await expect(page.locator(".civic-contact-card").nth(0)).toContainText(
    "Alesia Valda Bosman",
  );
  await expect(page.locator(".civic-contact-card").nth(1)).toContainText(
    "Justin Joseph Hendricks",
  );
  expect(
    await page.locator(".civic-contact-card").evaluateAll((cards) =>
      cards.every((card) => {
        const bounds = card.getBoundingClientRect();
        return (
          bounds.left >= 0 &&
          bounds.right <= window.innerWidth &&
          card.scrollWidth <= card.clientWidth
        );
      }),
    ),
  ).toBeTruthy();
  await expect(page.locator('a[href*="websitefeedback"]')).toBeVisible();
});
