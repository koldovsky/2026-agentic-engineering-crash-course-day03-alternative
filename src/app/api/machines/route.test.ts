import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import { GET as summaryRoute } from "../summary/route";
import { GET as promptsRoute } from "../prompts/route";
import { POST as exportRoute } from "../export/route";
import { withLedger } from "@/lib/storage";
import { sample } from "@/lib/test-fixtures";

const base = "http://127.0.0.1:3000";
const headers = { host: "127.0.0.1:3000", origin: base, "content-type": "application/json" };
let directory: string;
let database: string;
function request(method: string, body: unknown, extra = headers) {
  return new Request(base + "/api/machines", { method, headers: extra, body: JSON.stringify(body) });
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "token-atlas-display-route-"));
  database = join(directory, "test.sqlite");
  vi.stubEnv("TOKEN_ATLAS_DB", database);
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});

describe("local display-name API", () => {
  it("updates all display routes while preserving portable export and resets to imported attribution", async () => {
    withLedger((ledger) => ledger.merge(sample));
    const response = await PATCH(request("PATCH", { machineId: "m1", member: "Codex teammate", label: "Work laptop" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({
      machineId: "m1", member: "Codex teammate", label: "Work laptop",
      importedMember: "Alex", importedLabel: "Laptop", hasDisplayOverride: true,
    });
    const machines = await GET(new Request(base + "/api/machines", { headers }));
    expect((await machines.json())[0]).toMatchObject({ member: "Codex teammate", importedMember: "Alex", hasDisplayOverride: true });
    const summary = await summaryRoute(new Request(base + "/api/summary?member=Codex+teammate", { headers }));
    expect((await summary.json()).totals.events).toBe(1);
    const prompts = await promptsRoute(new Request(base + "/api/prompts?member=Codex+teammate", { headers }));
    expect((await prompts.json()).items[0]).toMatchObject({ member: "Codex teammate", machineLabel: "Work laptop" });
    const exported = await exportRoute(new Request(base + "/api/export", { method: "POST", headers, body: "{}" }));
    expect((await exported.json()).machines).toEqual(sample.machines);
    const reset = await DELETE(request("DELETE", { machineId: "m1" }));
    expect(await reset.json()).toEqual({ machineId: "m1", member: "Alex", label: "Laptop", importedMember: "Alex", importedLabel: "Laptop", hasDisplayOverride: false });
    const demo = await GET(new Request(base + "/api/machines?source=demo", { headers }));
    expect((await demo.json()).every((machine: { hasDisplayOverride: boolean }) => !machine.hasDisplayOverride)).toBe(true);
  });

  it("rejects invalid names, unknown fields and missing machines without changing existing aliases", async () => {
    withLedger((ledger) => ledger.merge(sample));
    for (const body of [
      { machineId: "m1", member: "", label: "Valid" },
      { machineId: "m1", member: "A\nB", label: "Valid" },
      { machineId: "m1", member: "A", label: "x".repeat(101) },
      { machineId: "m1", member: "A", label: "B", source: "demo" },
    ]) expect((await PATCH(request("PATCH", body))).status).toBe(400);
    expect((await DELETE(request("DELETE", { machineId: "m1", source: "demo" }))).status).toBe(400);
    expect((await PATCH(request("PATCH", { machineId: "unknown", member: "A", label: "B" }))).status).toBe(404);
    expect((await DELETE(request("DELETE", { machineId: "unknown" }))).status).toBe(404);
    expect(withLedger((ledger) => ledger.readDisplayNames().size)).toBe(0);
  });

  it("rejects foreign, cross-origin and originless mutation requests before persistence", async () => {
    for (const foreign of [
      { ...headers, host: "remote.example" },
      { ...headers, origin: "https://remote.example" },
      { ...headers, "sec-fetch-site": "cross-site" },
      { host: headers.host, "content-type": "application/json" },
    ]) {
      expect((await PATCH(request("PATCH", { machineId: "m1", member: "A", label: "B" }, foreign as typeof headers))).status).toBe(403);
      expect((await DELETE(request("DELETE", { machineId: "m1" }, foreign as typeof headers))).status).toBe(403);
    }
    expect(existsSync(database)).toBe(false);
  });
});
