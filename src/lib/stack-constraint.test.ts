// @trace TC-STACK-01
// The technical constraint is declared `local-verifiable`, so it needs a mechanism, not a sentence:
// check-acceptance-methods (artifact mode) failed the slice until this test existed.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  engines?: { node?: string };
  dependencies?: Record<string, string>;
};

describe("TC-STACK-01: Node 24, Next.js App Router, TypeScript strict, npm lockfile", () => {
  it("pins Node 24 in engines and runs on it", () => {
    expect(pkg.engines?.node).toBe(">=24.0.0 <25");
    expect(Number(process.versions.node.split(".")[0])).toBe(24);
  });

  it("uses the App Router on Next.js 16 with a committed npm lockfile", () => {
    expect(pkg.dependencies?.next).toMatch(/^16\./);
    expect(existsSync(join(root, "src", "app", "layout.tsx"))).toBe(true);
    expect(existsSync(join(root, "package-lock.json"))).toBe(true);
    expect(existsSync(join(root, "pnpm-lock.yaml"))).toBe(false);
  });

  it("compiles under TypeScript strict mode", () => {
    const tsconfig = readFileSync(join(root, "tsconfig.json"), "utf8");
    expect(tsconfig).toMatch(/"strict":\s*true/);
  });
});
