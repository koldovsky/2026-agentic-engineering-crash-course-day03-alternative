import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import type {
  MachineImportDefaults,
  MachineImportResult,
} from "../src/lib/machine-import-contract";
import type { Bundle } from "../src/lib/schema";

const origin = "http://127.0.0.1:3100";
const panel = (page: Page) =>
  page.getByRole("region", { name: "Import from this computer", exact: true });
const importButton = (page: Page) =>
  panel(page).getByRole("button", {
    name: "Import from this computer",
    exact: true,
  });

async function ready(page: Page, id: string, source = "local") {
  await page.goto(`/?view=sources&source=${source}`);
  await expect(importButton(page)).toBeEnabled();
  await panel(page).getByText("Names and folders", { exact: true }).click();
  await panel(page).getByLabel("Stable machine ID", { exact: true }).fill(id);
  await panel(page)
    .getByLabel("Computer name", { exact: true })
    .fill("Synthetic browser computer");
  await panel(page)
    .getByLabel("Team member", { exact: true })
    .fill("Machine import tester");
}

async function importMachine(page: Page): Promise<MachineImportResult> {
  const response = page.waitForResponse(
    (res) =>
      res.url().endsWith("/api/machine-import") &&
      res.request().method() === "POST",
  );
  await importButton(page).click();
  const result = await response;
  expect(result.status()).toBe(200);
  return result.json();
}

async function localData(page: Page): Promise<Bundle> {
  const response = await page.request.post("/api/export", {
    headers: { Origin: origin },
    data: { source: "local", includePrompts: true },
  });
  expect(response.status()).toBe(200);
  return response.json();
}

test.describe("one-click machine import", () => {
  test("imports both selected defaults with one action, blocks repeat clicks, and deduplicates", async ({
    page,
  }, testInfo) => {
    let posts = 0;
    page.on("request", (request) => {
      if (
        request.url().endsWith("/api/machine-import") &&
        request.method() === "POST"
      )
        posts++;
    });
    const defaultsResponse = page.waitForResponse(
      (res) =>
        res.url().endsWith("/api/machine-import") &&
        res.request().method() === "GET",
    );
    await page.goto("/?view=sources&source=demo");
    const defaults: MachineImportDefaults = await (
      await defaultsResponse
    ).json();
    await expect(importButton(page)).toBeEnabled();
    const ui = panel(page);
    await expect(
      ui.getByLabel("Stable machine ID", { exact: true }),
    ).not.toBeVisible();
    await expect(
      ui.getByLabel("Import Claude Code", { exact: true }),
    ).toBeChecked();
    await expect(ui.getByLabel("Import Codex", { exact: true })).toBeChecked();
    await expect(
      ui.getByLabel("Include human prompts from this computer", {
        exact: true,
      }),
    ).not.toBeChecked();
    await expect(ui).toContainText(
      resolve("samples/machine-import/claude/projects"),
    );
    await expect(ui).toContainText(
      resolve("samples/machine-import/codex/sessions"),
    );
    expect(posts).toBe(0);

    let release!: () => void;
    const blocked = new Promise<void>((done) => {
      release = done;
    });
    await page.route("**/api/machine-import", async (route) => {
      if (route.request().method() === "POST") await blocked;
      await route.continue();
    });
    const response = page.waitForResponse(
      (res) =>
        res.url().endsWith("/api/machine-import") &&
        res.request().method() === "POST",
    );
    // Submit through the keyboard; the optional settings are not prerequisites.
    await importButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(ui.getByLabel("Import Codex", { exact: true })).toBeDisabled();
    await expect(
      ui.getByLabel("Stable machine ID", { exact: true }),
    ).toBeDisabled();
    await expect(ui.getByRole("button", { name: /Importing/ })).toBeDisabled();
    release();
    const firstResponse = await response;
    expect(firstResponse.status()).toBe(200);
    const first: MachineImportResult = await firstResponse.json();
    expect(first).toMatchObject({
      status: "imported",
      partial: false,
      filesRead: 2,
      addedUsage: 2,
      addedPrompts: 0,
    });
    await expect(ui.getByRole("status")).toContainText("Import complete");
    await expect(
      ui.getByRole("link", { name: "View imported usage" }),
    ).toHaveAttribute("href", /source=local/);
    const saved = await localData(page);
    expect(
      saved.usage.filter((record) => record.machineId === defaults.machine.id),
    ).toHaveLength(2);
    expect(
      saved.prompts.filter(
        (record) => record.machineId === defaults.machine.id,
      ),
    ).toHaveLength(0);
    const repeat = await importMachine(page);
    expect(repeat).toMatchObject({
      addedUsage: 0,
      addedPrompts: 0,
      duplicates: 2,
    });
    expect(posts).toBe(2);
    await page.screenshot({
      path: testInfo.outputPath("machine-import-desktop.png"),
      fullPage: true,
    });
    await ui.getByRole("link", { name: "View imported usage" }).click();
    await expect(page).toHaveURL(/source=local/);
  });

  test("stores only opted-in human prompts and remembers settings without remembering consent", async ({
    page,
  }) => {
    await ready(page, "browser-machine-prompts");
    const ui = panel(page);
    await ui
      .getByLabel("Include human prompts from this computer", { exact: true })
      .check();
    const result = await importMachine(page);
    expect(result).toMatchObject({
      addedUsage: 2,
      addedPrompts: 2,
      partial: false,
    });
    const saved = await localData(page);
    const prompts = saved.prompts.filter(
      (record) => record.machineId === "browser-machine-prompts",
    );
    expect(prompts.map((record) => record.text).sort()).toEqual([
      "Synthetic machine import: add a readable summary.",
      "Synthetic machine import: verify the saved totals.",
    ]);
    expect(JSON.stringify(saved)).not.toContain(
      "MACHINE_FIXTURE_OUTPUT_MUST_NOT_BE_COLLECTED",
    );
    await page.reload();
    await expect(importButton(page)).toBeEnabled();
    await expect(
      ui.getByLabel("Include human prompts from this computer", {
        exact: true,
      }),
    ).not.toBeChecked();
    await ui.getByText("Names and folders", { exact: true }).click();
    await expect(
      ui.getByLabel("Stable machine ID", { exact: true }),
    ).toHaveValue("browser-machine-prompts");
    await expect(ui.getByLabel("Team member", { exact: true })).toHaveValue(
      "Machine import tester",
    );
  });

  test("reports missing roots and empty imports honestly at 375px", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 850 });
    await ready(page, "browser-machine-partial");
    const ui = panel(page);
    const missing = resolve(
      "samples/machine-import",
      `missing-${"synthetic-directory-".repeat(7)}`,
    );
    await ui.getByLabel("Claude Code folder", { exact: true }).fill(missing);
    const partial = await importMachine(page);
    expect(partial).toMatchObject({
      status: "imported",
      partial: true,
      filesRead: 1,
      addedUsage: 1,
    });
    await expect(ui.getByRole("status")).toContainText("Partial import");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("machine-import-mobile.png"),
      fullPage: true,
    });
    await ui
      .getByLabel("Stable machine ID", { exact: true })
      .fill("browser-machine-empty");
    await ui
      .getByLabel("Codex folder", { exact: true })
      .fill(`${missing}-codex`);
    const empty = await importMachine(page);
    expect(empty).toMatchObject({
      status: "empty",
      partial: true,
      addedUsage: 0,
      addedMachines: 0,
    });
    await expect(ui.getByRole("status")).toContainText("Nothing imported");
    const saved = await localData(page);
    expect(
      saved.machines.some((machine) => machine.id === "browser-machine-empty"),
    ).toBe(false);
  });

  test("recovers from unavailable defaults and an import error", async ({
    page,
  }) => {
    let defaultsFail = true;
    await page.route("**/api/machine-import", async (route) => {
      if (route.request().method() === "GET" && defaultsFail) {
        await route.fulfill({
          status: 500,
          json: { error: "Synthetic defaults unavailable." },
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 409,
          json: {
            error:
              "Synthetic changed session. Choose a completed session folder.",
          },
        });
      } else await route.continue();
    });
    await page.goto("/?view=sources");
    const ui = panel(page);
    await expect(ui.getByRole("alert")).toContainText(
      "Synthetic defaults unavailable.",
    );
    defaultsFail = false;
    await ui.getByRole("button", { name: /retry/i }).click();
    await expect(importButton(page)).toBeEnabled();
    await importButton(page).click();
    await expect(ui.getByRole("alert")).toContainText(
      "Choose a completed session folder.",
    );
    await expect(importButton(page)).toBeEnabled();
    await expect(ui.getByRole("status")).toHaveCount(0);
  });

  test("imports a selected source despite a cleared unselected folder and unavailable browser storage", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("Synthetic disabled storage");
      };
      Storage.prototype.setItem = () => {
        throw new Error("Synthetic disabled storage");
      };
    });
    await ready(page, "browser-machine-one-provider");
    const ui = panel(page);
    await ui.getByLabel("Codex folder", { exact: true }).fill("");
    await ui.getByLabel("Import Codex", { exact: true }).uncheck();
    const result = await importMachine(page);
    expect(result).toMatchObject({
      status: "imported",
      addedUsage: 1,
      addedPrompts: 0,
      partial: false,
    });
    expect(result.sources.map((source) => source.provider)).toEqual([
      "claude-code",
    ]);
    await expect(ui.getByRole("status")).toContainText("Import complete");
    await expect(ui.getByRole("alert")).toHaveCount(0);
  });

  test("remembers a deselected provider even after clearing its unused folder", async ({
    page,
  }) => {
    await ready(page, "browser-machine-preferences");
    const ui = panel(page);
    await ui.getByLabel("Codex folder", { exact: true }).fill("");
    await ui.getByLabel("Import Codex", { exact: true }).uncheck();
    await page.reload();
    await expect(importButton(page)).toBeEnabled();
    await expect(
      ui.getByLabel("Import Codex", { exact: true }),
    ).not.toBeChecked();
    await expect(
      ui.getByLabel("Import Claude Code", { exact: true }),
    ).toBeChecked();
    await ui.getByText("Names and folders", { exact: true }).click();
    await expect(ui.getByLabel("Codex folder", { exact: true })).toHaveValue(
      resolve("samples/machine-import/codex/sessions"),
    );
  });
});
