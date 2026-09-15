import { test, expect } from "@playwright/test";
import { writeFile, readFile } from "node:fs/promises";
import { sample } from "../src/lib/test-fixtures";

test.describe.serial("local dashboard journeys", () => {
  let browserErrors: string[];
  test.beforeEach(async ({ page }) => {
    browserErrors = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|hydrating|Minified React error/i.test(message.text())
      ) {
        browserErrors.push(message.text());
      }
    });
  });
  test.afterEach(() => expect(browserErrors).toEqual([]));
  test("shows precise reference rates and cache duration assumptions", async ({
    page,
  }) => {
    await page.goto("/?view=pricing");
    const row = page.getByRole("row").filter({ hasText: "gpt-5.3-codex" });
    await expect(
      row.getByRole("cell", { name: "$0.175", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Standard cache writes use 5 minutes/),
    ).toBeVisible();
  });
  test("starts empty and keeps the synthetic demo separate", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await expect(
      page.getByRole("link", { name: "Explore demo", exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Explore demo", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/source=demo/);
    await expect(page.getByTestId("metric-sessions")).toContainText("42");
    await expect(page.getByTestId("metric-members")).toContainText("4");
    await page.screenshot({
      path: testInfo.outputPath("desktop.png"),
      fullPage: true,
    });
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Explore demo", exact: true }).first(),
    ).toBeVisible();
  });

  test("filters unknown models honestly and clears filters", async ({
    page,
  }) => {
    await page.goto("/?source=demo");
    await page
      .getByLabel("Model", { exact: true })
      .selectOption("experimental-unpriced-model");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(page.getByTestId("metric-cost")).toContainText("Unpriced");
    await expect(page.getByTestId("metric-sessions")).toContainText("1");
    await page
      .getByRole("link", { name: "Clear filters", exact: true })
      .click();
    await expect(page.getByTestId("metric-sessions")).toContainText("42");
  });

  test("searches original prompts and paginates", async ({ page }) => {
    await page.goto("/?source=demo&view=prompts");
    await expect(page.getByText("Page 1 of 5", { exact: false })).toBeVisible();
    await page.getByRole("link", { name: "Next page", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await page
      .getByLabel("Search prompts", { exact: true })
      .fill("acceptance scenarios");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(
      page
        .getByText(
          "Write acceptance scenarios for importing a teammate's token usage file.",
          { exact: false },
        )
        .first(),
    ).toBeVisible();
  });

  test("previews and imports a file, survives reload and reports duplicates", async ({
    page,
  }, testInfo) => {
    const path = testInfo.outputPath("team.json");
    await writeFile(path, JSON.stringify(sample));
    await page.goto("/?view=sources");
    await page.getByLabel("Usage file", { exact: true }).setInputFiles(path);
    await page
      .getByRole("button", { name: "Preview file", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Import data", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Import data", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("1");
    await page.goto("/");
    await page.reload();
    await expect(page.getByTestId("metric-sessions")).toContainText("1");
    await page.goto("/?view=sources");
    await page.getByLabel("Usage file", { exact: true }).setInputFiles(path);
    await page
      .getByRole("button", { name: "Preview file", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Import data", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(/2 duplicates/i);
  });

  test("downloads usage without prompts unless explicitly selected", async ({
    page,
  }) => {
    await page.goto("/?view=sources");
    const checkbox = page.getByLabel("Include prompts in export", {
      exact: true,
    });
    // The export control may expose its options through an opening button.
    if (!(await checkbox.isVisible()))
      await page.getByText("Export data", { exact: true }).click();
    await expect(checkbox).not.toBeChecked();
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download JSON", exact: true })
      .click();
    const download = await downloadEvent;
    const path = await download.path();
    const text = await readFile(path!, "utf8");
    expect(JSON.parse(text).prompts).toEqual([]);
    expect(text).not.toContain(sample.prompts[0].text);

    await checkbox.check();
    const fullDownloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download JSON", exact: true })
      .click();
    const fullDownload = await fullDownloadEvent;
    const fullText = await readFile((await fullDownload.path())!, "utf8");
    expect(JSON.parse(fullText).prompts).toEqual(sample.prompts);
  });

  test("collects only human prompts from a selected transcript", async ({
    page,
  }) => {
    await page.goto("/?view=sources");
    await page
      .getByLabel("File format", { exact: true })
      .selectOption("transcript");
    await page
      .getByLabel("Usage file", { exact: true })
      .setInputFiles("samples/claude/session.jsonl");
    await page
      .getByLabel("Member name", { exact: true })
      .fill("Workshop presenter");
    await page
      .getByLabel("Machine ID", { exact: true })
      .fill("browser-fixture");
    await page
      .getByLabel("Machine label", { exact: true })
      .fill("Workshop machine");
    await expect(
      page.getByLabel("Collect human prompts", { exact: true }),
    ).not.toBeChecked();
    await page.getByLabel("Collect human prompts", { exact: true }).check();
    await page
      .getByRole("button", { name: "Preview file", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Import data", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Imported 1 usage records and 1 prompts",
    );
    await page.goto("/?view=prompts");
    await page
      .getByLabel("Team member", { exact: true })
      .selectOption("Workshop presenter");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(
      page
        .getByText(
          "Write acceptance scenarios for importing team usage files.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(
      "MUST_NOT_BE_COLLECTED",
    );
  });

  test("shows validation errors and remains usable at 375px", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 850 });
    await page.goto("/?source=demo");
    await expect(page.getByTestId("metric-sessions")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("mobile.png"),
      fullPage: true,
    });
    await page.goto("/?view=sources");
    const path = testInfo.outputPath("bad.json");
    await writeFile(path, '{"schemaVersion":999}');
    await page.getByLabel("Usage file", { exact: true }).setInputFiles(path);
    await page
      .getByRole("button", { name: "Preview file", exact: true })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
