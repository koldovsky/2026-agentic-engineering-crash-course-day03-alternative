import { test, expect } from "@playwright/test";

test.describe("CSV summary download", () => {
  test("Download CSV is keyboard-reachable, downloads a dated file, and the card does not overflow at 375px", async ({
    page,
  }) => {
    await page.goto("/?source=demo&view=overview");
    await expect(
      page.getByRole("heading", { name: "Usage by model", exact: true }),
    ).toBeVisible();
    const card = page
      .locator(".card")
      .filter({ has: page.getByRole("heading", { name: "Usage by model", exact: true }) });

    const button = page.getByRole("button", { name: "Download CSV" });
    await expect(button).toBeEnabled();

    // Tab through the page until the button itself has focus.
    let focused = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if (await button.evaluate((el) => el === document.activeElement)) {
        focused = true;
        break;
      }
    }
    expect(focused).toBe(true);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.keyboard.press("Enter"),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^token-atlas-summary-demo-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    // The success path, not merely that a download fired: no failure alert
    // from this card, and the honest "started" status (never "completed").
    await expect(card.getByRole("alert")).toHaveCount(0);
    await expect(card.getByRole("status")).toContainText(
      /^Download started: token-atlas-summary-demo-/,
    );

    await page.setViewportSize({ width: 375, height: 850 });
    const overflow = await card.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(overflow).toBe(true);
  });
});
