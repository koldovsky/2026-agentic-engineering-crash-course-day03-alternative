import {
  test,
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";

type Bounds = { x: number; y: number; width: number; height: number };
type ArtworkGeometry = {
  label: string;
  slot: Bounds;
  artwork: Bounds;
  strokePadding: number;
  centerDelta: { x: number; y: number };
};

// Measure the painted artwork, not just the SVG viewport: centered viewports can
// still contain off-center artwork, which was the defect in the original glyphs.
async function measureArtwork(
  slot: Locator,
  label: string,
): Promise<ArtworkGeometry> {
  return slot.evaluate((element, name) => {
    const group = element.querySelector("svg > g");
    if (!(group instanceof SVGGraphicsElement))
      throw new Error("Missing SVG artwork group");
    const matrix = group.getScreenCTM();
    if (!matrix) throw new Error("Artwork has no screen transform");
    const box = group.getBBox();
    const corners = [
      new DOMPoint(box.x, box.y),
      new DOMPoint(box.x + box.width, box.y),
      new DOMPoint(box.x, box.y + box.height),
      new DOMPoint(box.x + box.width, box.y + box.height),
    ].map((point) => point.matrixTransform(matrix));
    const x = Math.min(...corners.map((point) => point.x));
    const y = Math.min(...corners.map((point) => point.y));
    const artwork = {
      x,
      y,
      width: Math.max(...corners.map((point) => point.x)) - x,
      height: Math.max(...corners.map((point) => point.y)) - y,
    };
    const rect = element.getBoundingClientRect();
    const slotBounds = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
    const strokeWidth = Math.max(
      0,
      ...Array.from(group.querySelectorAll("*")).map((shape) => {
        const style = getComputedStyle(shape);
        return style.stroke === "none"
          ? 0
          : Number.parseFloat(style.strokeWidth) || 0;
      }),
    );
    return {
      label: name,
      slot: slotBounds,
      artwork,
      // getBBox excludes strokes. Include the round-cap stroke radius when
      // checking containment, projected to CSS pixels at the rendered size.
      strokePadding:
        (strokeWidth / 2) *
        Math.max(
          Math.hypot(matrix.a, matrix.b),
          Math.hypot(matrix.c, matrix.d),
        ),
      centerDelta: {
        x: artwork.x + artwork.width / 2 - (rect.x + rect.width / 2),
        y: artwork.y + artwork.height / 2 - (rect.y + rect.height / 2),
      },
    };
  }, label);
}

function assertArtworkAligned(geometry: ArtworkGeometry) {
  const { label, slot, artwork, strokePadding, centerDelta } = geometry;
  expect(
    Math.abs(centerDelta.x),
    `${label}: horizontal center`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(centerDelta.y),
    `${label}: vertical center`,
  ).toBeLessThanOrEqual(1);
  expect(artwork.width, `${label}: nonempty artwork`).toBeGreaterThan(0);
  expect(artwork.height, `${label}: nonempty artwork`).toBeGreaterThan(0);
  expect(
    artwork.x - strokePadding,
    `${label}: left stroke is contained`,
  ).toBeGreaterThanOrEqual(slot.x - 0.1);
  expect(
    artwork.y - strokePadding,
    `${label}: top stroke is contained`,
  ).toBeGreaterThanOrEqual(slot.y - 0.1);
  expect(
    artwork.x + artwork.width + strokePadding,
    `${label}: right stroke is contained`,
  ).toBeLessThanOrEqual(slot.x + slot.width + 0.1);
  expect(
    artwork.y + artwork.height + strokePadding,
    `${label}: bottom stroke is contained`,
  ).toBeLessThanOrEqual(slot.y + slot.height + 0.1);
}

async function captureCrop(
  page: Page,
  context: Locator,
  name: string,
  testInfo: TestInfo,
) {
  const clip = await context.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const padding = 24;
    const x = Math.max(0, Math.floor(rect.x + window.scrollX - padding));
    const y = Math.max(0, Math.floor(rect.y + window.scrollY - padding));
    return {
      x,
      y,
      width: Math.min(
        document.documentElement.scrollWidth - x,
        Math.ceil(rect.x + window.scrollX + rect.width + padding) - x,
      ),
      height: Math.min(
        document.documentElement.scrollHeight - y,
        Math.ceil(rect.y + window.scrollY + rect.height + padding) - y,
      ),
    };
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, clip, fullPage: true, scale: "css" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 375, height: 850 },
]) {
  test(`provider artwork is centered at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/?source=demo&view=overview");
    // Streaming SSR may contain metric text before the loading boundary clears.
    // Require the actual rendered sections before taking any visual evidence.
    await expect(
      page.getByRole("heading", { name: "Usage by model", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent sessions", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".loading-state")).toBeHidden();
    await expect(page.getByTestId("metric-sessions")).toContainText("42");

    const measurements: ArtworkGeometry[] = [];
    for (const provider of ["claude-code", "codex"] as const) {
      for (const variant of ["model", "badge"] as const) {
        const selector =
          variant === "model"
            ? `.model-icon.${provider}`
            : `.provider-${provider} .provider-mark`;
        const slot = page.locator(selector).first();
        await expect(slot).toBeVisible();
        await slot.scrollIntoViewIfNeeded();
        const svg = slot.locator("svg");
        await expect(svg).toHaveAttribute("aria-hidden", "true");
        await expect(svg).toHaveAttribute("focusable", "false");
        await expect(svg).toHaveAttribute(
          "width",
          variant === "model" ? "20" : "12",
        );
        await expect(svg).toHaveAttribute(
          "height",
          variant === "model" ? "20" : "12",
        );
        await expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
        await expect(svg.locator("title")).toHaveCount(0);
        await expect(slot).toHaveAttribute("aria-hidden", "true");
        if (variant === "badge") {
          await expect(slot.locator("..")).toContainText(
            provider === "claude-code" ? "Claude Code" : "Codex",
          );
        }

        const label = `${variant}-${provider}`;
        const geometry = await measureArtwork(slot, label);
        measurements.push(geometry);
        assertArtworkAligned(geometry);
        expect(geometry.slot.width).toBeCloseTo(
          variant === "model" ? 28 : 12,
          1,
        );
        expect(geometry.slot.height).toBeCloseTo(
          variant === "model" ? 28 : 12,
          1,
        );
        await captureCrop(
          page,
          variant === "badge" ? slot.locator("..") : slot,
          label,
          testInfo,
        );
      }
    }

    // All four actual artwork variants have now been rendered and measured.
    // Restore the normal page/table position for the full-page context evidence.
    await page.locator(".table-scroll").evaluateAll((elements) => {
      for (const element of elements) element.scrollLeft = 0;
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".loading-state")).toBeHidden();
    const pagePath = testInfo.outputPath("overview-context.png");
    await page.screenshot({ path: pagePath, fullPage: true, scale: "css" });
    await testInfo.attach("overview-context", {
      path: pagePath,
      contentType: "image/png",
    });

    // A controlled defect must fail the very assertion used above. This changes
    // only this isolated page, then restores it; production files stay untouched.
    const faultSlot = page.locator(".model-icon.claude-code").first();
    await faultSlot.scrollIntoViewIfNeeded();
    const before = await measureArtwork(faultSlot, "controlled-fault");
    assertArtworkAligned(before);
    const originalTransform = await faultSlot
      .locator("svg > g")
      .evaluate((element) => {
        const group = element as SVGGraphicsElement;
        const matrix = group.getScreenCTM();
        if (!matrix)
          throw new Error("Cannot inject fault without screen transform");
        const original = group.getAttribute("transform");
        group.setAttribute(
          "transform",
          `translate(0 ${4 / Math.hypot(matrix.c, matrix.d)})`,
        );
        return original;
      });
    let shifted: ArtworkGeometry | undefined;
    try {
      shifted = await measureArtwork(faultSlot, "controlled-fault");
      expect(shifted.centerDelta.y - before.centerDelta.y).toBeCloseTo(4, 2);
      expect(() => assertArtworkAligned(shifted!)).toThrow(/vertical center/);
    } finally {
      await faultSlot.locator("svg > g").evaluate((element, original) => {
        if (original === null) element.removeAttribute("transform");
        else element.setAttribute("transform", original);
      }, originalTransform);
    }
    const restored = await measureArtwork(
      faultSlot,
      "controlled-fault-restored",
    );
    assertArtworkAligned(restored);
    const geometryPath = testInfo.outputPath("artwork-geometry.json");
    await writeFile(
      geometryPath,
      JSON.stringify(
        {
          viewport,
          measurements,
          controlledFault: { before, shifted, restored },
        },
        null,
        2,
      ),
    );
    await testInfo.attach("artwork-geometry", {
      path: geometryPath,
      contentType: "application/json",
    });
  });
}
