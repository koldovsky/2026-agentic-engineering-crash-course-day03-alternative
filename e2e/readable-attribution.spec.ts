import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { Bundle, Provider } from "../src/lib/schema";

const origin = "http://127.0.0.1:3100";
const sessionIds = {
  "claude-code": "cfd5c6e3-6bcd-4a78-9f94-7c7bb59bdce4",
  codex: "843b865a-bcd1-47e3-b5cb-437868bc6325",
};

function fixture(machineId: string, member = "Codex teammate"): Bundle {
  return {
    schemaVersion: 1,
    exportedAt: "2026-09-17T10:00:00.000Z",
    machines: [{ id: machineId, label: "Synthetic workshop computer", member }],
    usage: [
      {
        id: "attribution-claude-1",
        machineId,
        provider: "claude-code",
        sessionId: sessionIds["claude-code"],
        timestamp: "2026-09-17T09:30:00.000Z",
        model: "claude-sonnet-4-6",
        tokens: {
          input: 100,
          cacheRead: 20,
          cacheWrite: 0,
          cacheWrite1h: 0,
          output: 30,
          reasoning: 0,
        },
      },
      {
        id: "attribution-claude-2",
        machineId,
        provider: "claude-code",
        sessionId: sessionIds["claude-code"],
        timestamp: "2026-09-17T09:42:00.000Z",
        model: "claude-sonnet-4-6",
        tokens: {
          input: 120,
          cacheRead: 30,
          cacheWrite: 0,
          cacheWrite1h: 0,
          output: 40,
          reasoning: 0,
        },
      },
      {
        id: "attribution-codex-1",
        machineId,
        provider: "codex",
        sessionId: sessionIds.codex,
        timestamp: "2026-09-17T09:35:00.000Z",
        model: "gpt-5.4",
        tokens: {
          input: 200,
          cacheRead: 40,
          cacheWrite: 0,
          cacheWrite1h: 0,
          output: 50,
          reasoning: 10,
        },
      },
    ],
    prompts: [
      {
        id: "attribution-human-prompt",
        machineId,
        provider: "claude-code",
        sessionId: sessionIds["claude-code"],
        timestamp: "2026-09-17T09:30:00.000Z",
        text: "SYNTHETIC PROMPT MUST NOT BECOME A SESSION TITLE",
      },
    ],
  };
}

async function importFixture(page: Page, bundle: Bundle) {
  const response = await page.request.post("/api/import", {
    headers: { Origin: origin },
    data: { kind: "bundle", bundle, preview: false },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    addedUsage: 3,
    addedPrompts: 1,
  });
}

function sessionRow(page: Page, machineId: string, provider: Provider) {
  return page.getByTestId(
    `session-${machineId}-${provider}-${sessionIds[provider]}`,
  );
}

function disclosure(scope: Locator, text: string) {
  return scope.locator("summary").filter({ hasText: new RegExp(`^${text}$`) });
}

async function keyboardOpen(page: Page, summary: Locator) {
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
}

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function memberGeometry(member: Locator) {
  return member.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: bounds.width,
      height: bounds.height,
      lineHeight:
        Number.parseFloat(style.lineHeight) ||
        Number.parseFloat(style.fontSize) * 1.5,
    };
  });
}

function assertReadableMember(
  geometry: Awaited<ReturnType<typeof memberGeometry>>,
) {
  // A long name needs readable lines even when the containing table scrolls.
  // One-character columns made whole Sources rows almost a screen tall.
  expect(
    geometry.width,
    "member text has room for readable words",
  ).toBeGreaterThanOrEqual(140);
  expect(
    geometry.height,
    "long member name stays within eight text lines",
  ).toBeLessThanOrEqual(geometry.lineHeight * 8);
}

async function exportRaw(page: Page): Promise<Bundle> {
  const response = await page.request.post("/api/export", {
    headers: { Origin: origin },
    data: { source: "local", includePrompts: true },
  });
  expect(response.status()).toBe(200);
  return response.json();
}

test.describe("readable session attribution", () => {
  let browserErrors: string[];
  test.beforeEach(async ({ page }) => {
    browserErrors = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|hydrating|Minified React error/i.test(message.text())
      )
        browserErrors.push(message.text());
    });
  });
  test.afterEach(() => expect(browserErrors).toEqual([]));

  test("shows observed session time and actual providers with keyboard-accessible identifiers", async ({
    page,
  }) => {
    const bundle = fixture("readable-session-keyboard");
    await importFixture(page, bundle);
    await page.goto(
      `/?source=local&member=${encodeURIComponent(bundle.machines[0].member)}`,
    );
    const claude = sessionRow(page, bundle.machines[0].id, "claude-code");
    const codex = sessionRow(page, bundle.machines[0].id, "codex");
    await expect(
      claude.getByText("Session · Sep 17, 09:30 UTC", { exact: true }),
    ).toBeVisible();
    await expect(
      codex.getByText("Session · Sep 17, 09:35 UTC", { exact: true }),
    ).toBeVisible();
    await expect(claude).toContainText("Codex teammate");
    await expect(claude).toContainText("Synthetic workshop computer");
    await expect(
      claude.getByText("Claude Code", { exact: true }),
    ).toBeVisible();
    await expect(codex.getByText("Codex", { exact: true })).toBeVisible();
    await expect(
      claude.getByText(sessionIds["claude-code"], { exact: true }),
    ).not.toBeVisible();
    await expect(
      codex.getByText(sessionIds.codex, { exact: true }),
    ).not.toBeVisible();
    expect(await page.content()).not.toContain(bundle.prompts[0].text);
    await keyboardOpen(page, disclosure(claude, "Session details"));
    await expect(
      claude.getByText(sessionIds["claude-code"], { exact: true }),
    ).toBeVisible();
    await expect(
      claude.getByText(bundle.machines[0].id, { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(
      claude.getByText(sessionIds["claude-code"], { exact: true }),
    ).not.toBeVisible();
  });

  test("persists local names across views, preserves portable attribution, deduplicates and resets", async ({
    page,
  }) => {
    const bundle = fixture("readable-local-alias", "CodexSandboxOffline");
    await importFixture(page, bundle);
    await page.goto("/?source=local&view=sources");
    const row = page.getByTestId(`machine-${bundle.machines[0].id}`);
    await expect(row.getByText("Local user", { exact: true })).toBeVisible();
    await expect(
      row.getByText("CodexSandboxOffline", { exact: true }),
    ).not.toBeVisible();
    await keyboardOpen(page, disclosure(row, "Imported attribution"));
    await expect(
      row.getByText("CodexSandboxOffline", { exact: true }),
    ).toBeVisible();
    await keyboardOpen(page, disclosure(row, "Edit display names"));
    await row
      .getByLabel("Member display name", { exact: true })
      .fill("Codex teammate display alias");
    await row
      .getByLabel("Computer display name", { exact: true })
      .fill("Workshop review laptop");
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/machines") &&
        response.request().method() === "PATCH",
    );
    await row
      .getByRole("button", { name: "Save display names", exact: true })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(row).toContainText("Codex teammate display alias");
    await expect(row).toContainText("Workshop review laptop");
    await page.reload();
    await expect(row).toContainText("Codex teammate display alias");
    await expect(row).toContainText("Workshop review laptop");

    await page.goto("/?source=local");
    await page
      .getByLabel("Team member", { exact: true })
      .selectOption("Codex teammate display alias");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(page.getByTestId("metric-sessions")).toContainText("2");
    await expect(
      sessionRow(page, bundle.machines[0].id, "claude-code"),
    ).toContainText("Workshop review laptop");
    await expect(
      sessionRow(page, bundle.machines[0].id, "claude-code").getByText(
        "Claude Code",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      sessionRow(page, bundle.machines[0].id, "codex").getByText("Codex", {
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(
      "/?source=local&view=team&member=Codex%20teammate%20display%20alias",
    );
    await expect(
      page.getByRole("heading", {
        name: "Codex teammate display alias",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(
      "/?source=local&view=prompts&member=Codex%20teammate%20display%20alias",
    );
    const prompt = page
      .locator(".prompt-card")
      .filter({ hasText: bundle.prompts[0].text });
    await expect(
      prompt.getByText("Codex teammate display alias", { exact: true }),
    ).toBeVisible();
    await keyboardOpen(page, prompt.locator("summary"));
    await expect(
      prompt.getByText("Workshop review laptop", { exact: true }),
    ).toBeVisible();

    const raw = await exportRaw(page);
    expect(
      raw.machines.find((machine) => machine.id === bundle.machines[0].id),
    ).toEqual(bundle.machines[0]);
    expect(
      raw.usage.filter((usage) => usage.machineId === bundle.machines[0].id),
    ).toEqual(expect.arrayContaining(bundle.usage));
    expect(
      raw.prompts.filter((item) => item.machineId === bundle.machines[0].id),
    ).toEqual(bundle.prompts);

    await page.goto("/?source=local&view=sources");
    const importer = page.getByRole("region", {
      name: "Import usage",
      exact: true,
    });
    await importer.getByLabel("Usage file", { exact: true }).setInputFiles({
      name: "synthetic-attribution.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(bundle)),
    });
    await importer
      .getByRole("button", { name: "Preview file", exact: true })
      .click();
    await importer
      .getByRole("button", { name: "Import data", exact: true })
      .click();
    await expect(importer.getByRole("status")).toContainText(
      "4 duplicates skipped",
    );
    await expect(row).toContainText("Codex teammate display alias");
    const repeated = await exportRaw(page);
    expect(
      repeated.usage.filter(
        (usage) => usage.machineId === bundle.machines[0].id,
      ),
    ).toHaveLength(3);
    expect(
      repeated.machines.find((machine) => machine.id === bundle.machines[0].id),
    ).toEqual(bundle.machines[0]);

    await keyboardOpen(page, disclosure(row, "Edit display names"));
    const reset = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/machines") &&
        response.request().method() === "DELETE",
    );
    await row
      .getByRole("button", { name: "Reset display names", exact: true })
      .click();
    expect((await reset).status()).toBe(200);
    await expect(row.getByText("Local user", { exact: true })).toBeVisible();
    await expect(row).not.toContainText("Codex teammate display alias");
    await page.reload();
    await expect(row.getByText("Local user", { exact: true })).toBeVisible();
    await page.goto("/?source=local");
    await expect(
      page.getByLabel("Team member", { exact: true }).getByRole("option", {
        name: "Codex teammate display alias",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.goto("/?source=demo&view=sources");
    await expect(
      page.getByText("Edit display names", { exact: true }),
    ).toHaveCount(0);
  });

  for (const width of [1280, 375]) {
    test(`renders long display names and identifier disclosures at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const bundle = fixture(
        `readable-visual-${width}`,
        `Codex teammate visual ${width}`,
      );
      await importFixture(page, bundle);
      const member = `Codex teammate ${width} — quality engineering and release verification across distributed teams`;
      const label =
        "Development workstation — accessible session attribution checks for a shared workshop computer";
      const changed = await page.request.patch("/api/machines", {
        headers: { Origin: origin },
        data: { machineId: bundle.machines[0].id, member, label },
      });
      expect(changed.status()).toBe(200);
      await page.goto(`/?source=local&member=${encodeURIComponent(member)}`);
      const row = sessionRow(page, bundle.machines[0].id, "claude-code");
      await expect(
        row.getByText("Session · Sep 17, 09:30 UTC", { exact: true }),
      ).toBeVisible();
      await expect(row).toContainText(member);
      await expect(row).toContainText(label);
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`sessions-${width}-context.png`),
        fullPage: true,
      });
      await keyboardOpen(page, disclosure(row, "Session details"));
      await expect(
        row.getByText(sessionIds["claude-code"], { exact: true }),
      ).toBeVisible();
      await row
        .locator("td")
        .first()
        .screenshot({
          path: testInfo.outputPath(`session-${width}-details-crop.png`),
        });
      await expectNoPageOverflow(page);

      await page.goto("/?source=local&view=sources");
      await expect(
        page.getByRole("button", {
          name: "Import from this computer",
          exact: true,
        }),
      ).toBeEnabled();
      const machine = page.getByTestId(`machine-${bundle.machines[0].id}`);
      await keyboardOpen(page, disclosure(machine, "Edit display names"));
      await expect(
        machine.getByLabel("Member display name", { exact: true }),
      ).toHaveValue(member);
      await expect(
        machine.getByLabel("Computer display name", { exact: true }),
      ).toHaveValue(label);
      await keyboardOpen(page, disclosure(machine, "Imported attribution"));
      await expect(
        machine.getByText(bundle.machines[0].member, { exact: true }),
      ).toBeVisible();
      const displayedMember = machine
        .locator("td")
        .nth(1)
        .locator(".session-member > span")
        .last();
      const geometry = await memberGeometry(displayedMember);
      assertReadableMember(geometry);
      let negativeControl: Awaited<ReturnType<typeof memberGeometry>> | null =
        null;
      if (width === 375) {
        const previousStyle = await displayedMember.getAttribute("style");
        try {
          await displayedMember.evaluate((element) => {
            const html = element as HTMLElement;
            html.style.setProperty("width", "6px", "important");
            html.style.setProperty("min-width", "6px", "important");
            html.style.setProperty("max-width", "6px", "important");
            html.style.setProperty("flex", "0 0 6px", "important");
          });
          const narrowed = await memberGeometry(displayedMember);
          negativeControl = narrowed;
          expect(
            () => assertReadableMember(narrowed),
            "the guard rejects a controlled one-character column",
          ).toThrow();
        } finally {
          await displayedMember.evaluate((element, original) => {
            if (original === null) element.removeAttribute("style");
            else element.setAttribute("style", original);
          }, previousStyle);
        }
        assertReadableMember(await memberGeometry(displayedMember));
      }
      const geometryPath = testInfo.outputPath(`member-geometry-${width}.json`);
      await writeFile(
        geometryPath,
        JSON.stringify(
          { normal: geometry, rejectedNegativeControl: negativeControl },
          null,
          2,
        ),
      );
      await testInfo.attach(`member-geometry-${width}`, {
        path: geometryPath,
        contentType: "application/json",
      });
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`sources-${width}-context.png`),
        fullPage: true,
      });
      await machine
        .locator("td")
        .first()
        .screenshot({
          path: testInfo.outputPath(`machine-${width}-edit-crop.png`),
        });
    });
  }
});
