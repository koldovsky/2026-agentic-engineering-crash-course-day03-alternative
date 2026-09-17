import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { MachineImportResult } from "../src/lib/machine-import-contract";
import type { Bundle } from "../src/lib/schema";

const origin = "http://127.0.0.1:3100";
const machineId = "current-codex-browser-backfill";
const member = "Current Codex prompt tester";
const computer = "Synthetic Codex recovery computer";
const copperPrompt = "Synthetic Codex: reconcile the copper invoice.";
const cobaltPrompt =
  "Synthetic Codex: verify the cobalt summary.\nKeep the totals unchanged.";

const panel = (page: Page) =>
  page.getByRole("region", { name: "Import from this computer", exact: true });
const importButton = (page: Page) =>
  panel(page).getByRole("button", {
    name: "Import from this computer",
    exact: true,
  });

async function importMachine(page: Page): Promise<MachineImportResult> {
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith("/api/machine-import") &&
      result.request().method() === "POST",
  );
  await importButton(page).click();
  const imported = await response;
  expect(imported.status()).toBe(200);
  await expect(importButton(page)).toBeEnabled();
  return imported.json();
}

async function savedData(page: Page): Promise<Bundle> {
  const response = await page.request.post("/api/export", {
    headers: { Origin: origin },
    data: { source: "local", includePrompts: true },
  });
  expect(response.status()).toBe(200);
  return response.json();
}

test("backfills current Codex human prompts through explicit import without duplicate usage or private exports", async ({
  page,
}, testInfo) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrating|Minified React error/i.test(message.text())
    )
      browserErrors.push(message.text());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?source=local&view=sources");
  await expect(importButton(page)).toBeEnabled();
  const importer = panel(page);
  await importer.getByText("Names and folders", { exact: true }).click();
  await importer
    .getByLabel("Stable machine ID", { exact: true })
    .fill(machineId);
  await importer.getByLabel("Team member", { exact: true }).fill(member);
  await importer.getByLabel("Computer name", { exact: true }).fill(computer);
  await importer
    .getByLabel("Codex folder", { exact: true })
    .fill(resolve("samples/codex-current-prompts"));
  await importer.getByLabel("Import Claude Code", { exact: true }).uncheck();
  await expect(
    importer.getByLabel("Import Codex", { exact: true }),
  ).toBeChecked();
  const consent = importer.getByLabel(
    "Include human prompts from this computer",
    {
      exact: true,
    },
  );
  await expect(consent).not.toBeChecked();

  const initial = await importMachine(page);
  expect(initial).toMatchObject({
    status: "imported",
    partial: false,
    filesRead: 2,
    addedUsage: 2,
    addedPrompts: 0,
    duplicates: 0,
  });
  const before = await savedData(page);
  const originalUsage = before.usage.filter(
    (record) => record.machineId === machineId,
  );
  expect(originalUsage).toHaveLength(2);
  expect(
    before.prompts.filter((record) => record.machineId === machineId),
  ).toEqual([]);
  await page.goto(
    `/?source=local&view=prompts&provider=codex&member=${encodeURIComponent(member)}`,
  );
  await expect(
    page.getByRole("heading", { name: "0 human prompts", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".prompt-card")).toHaveCount(0);

  await page.goto("/?source=local&view=sources");
  await expect(importButton(page)).toBeEnabled();
  await expect(consent).not.toBeChecked();
  await consent.check();
  const recovered = await importMachine(page);
  expect(recovered).toMatchObject({
    status: "imported",
    partial: false,
    filesRead: 2,
    addedUsage: 0,
    addedPrompts: 2,
    duplicates: 2,
  });
  await expect(importer.getByRole("status")).toContainText(
    "Saved 0 usage records and 2 human prompts",
  );
  const repeated = await importMachine(page);
  expect(repeated).toMatchObject({
    addedUsage: 0,
    addedPrompts: 0,
    duplicates: 4,
  });
  const after = await savedData(page);
  expect(
    after.usage.filter((record) => record.machineId === machineId),
  ).toEqual(originalUsage);
  const prompts = after.prompts.filter(
    (record) => record.machineId === machineId,
  );
  expect(prompts).toHaveLength(2);
  expect(prompts.map((record) => record.text).sort()).toEqual(
    [copperPrompt, cobaltPrompt].sort(),
  );
  expect(prompts.every((record) => record.provider === "codex")).toBe(true);
  expect(
    prompts.every(
      (record) => record.sessionId === "current-codex-browser-main",
    ),
  ).toBe(true);
  expect(JSON.stringify(after)).not.toContain("MUST_NOT_BE_COLLECTED");

  await page.getByText("Export data", { exact: true }).click();
  await expect(
    page.getByLabel("Include prompts in export", { exact: true }),
  ).not.toBeChecked();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download JSON", exact: true })
    .click();
  const downloaded = await downloadEvent;
  const downloadedPath = await downloaded.path();
  expect(downloadedPath).not.toBeNull();
  const defaultExport = await readFile(downloadedPath!, "utf8");
  expect(JSON.parse(defaultExport).prompts).toEqual([]);
  expect(defaultExport).not.toContain(copperPrompt);
  expect(defaultExport).not.toContain("MUST_NOT_BE_COLLECTED");

  await page.goto(
    `/?source=local&view=prompts&member=${encodeURIComponent(member)}`,
  );
  await page.getByLabel("Provider", { exact: true }).selectOption("codex");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(page).toHaveURL(/provider=codex/);
  await expect(
    page.getByRole("heading", { name: "2 human prompts", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".prompt-card")).toHaveCount(2);
  await expect(
    page.locator(".prompt-excerpt").filter({ hasText: copperPrompt }),
  ).toBeVisible();
  await expect(
    page.locator(".prompt-excerpt").filter({ hasText: "cobalt summary" }),
  ).toBeVisible();
  await page.getByLabel("Search prompts", { exact: true }).fill("copper");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "1 human prompt", exact: true }),
  ).toBeVisible();
  const card = page.locator(".prompt-card");
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Codex", { exact: true })).toBeVisible();
  await card.locator("summary").click();
  await expect(card.locator("pre")).toHaveText(copperPrompt);
  await expect(card).toContainText(computer);
  await expect(card).toContainText("current-codex-browser-main");
  await expect(page.locator("main")).not.toContainText("MUST_NOT_BE_COLLECTED");

  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(card.locator("pre")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`codex-prompts-${width}-context.png`),
      fullPage: true,
    });
    await card.screenshot({
      path: testInfo.outputPath(`codex-prompts-${width}-card.png`),
    });
  }
  expect(browserErrors).toEqual([]);
});
