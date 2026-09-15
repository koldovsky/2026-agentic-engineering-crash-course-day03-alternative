import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { POST as importRoute } from "../app/api/import/route";
import { POST as exportRoute } from "../app/api/export/route";
import { GET as summaryRoute } from "../app/api/summary/route";
import { GET as promptsRoute } from "../app/api/prompts/route";
import { sample } from "./test-fixtures";

const base = "http://127.0.0.1:3000";
const headers = { host: "127.0.0.1:3000", origin: base, "content-type": "application/json" };
function post(path: string, body: unknown) { return new Request(base + path, { method: "POST", headers, body: JSON.stringify(body) }); }

describe("route integration", () => {
  it("previews, imports, searches, exports privately, and rejects conflicts without changing totals", async () => {
    const directory = mkdtempSync(join(tmpdir(), "token-atlas-routes-"));
    vi.stubEnv("TOKEN_ATLAS_DB", join(directory, "test.sqlite"));
    const summary = () => summaryRoute(new Request(base + "/api/summary", { headers }));
    try {
      expect((await importRoute(post("/api/import", { kind: "bundle", bundle: sample, preview: true }))).status).toBe(200);
      expect((await (await summary()).json()).totals.events).toBe(0);
      expect((await importRoute(post("/api/import", { kind: "bundle", bundle: sample }))).status).toBe(200);
      const repeated = await importRoute(post("/api/import", { kind: "bundle", bundle: sample }));
      expect(await repeated.json()).toMatchObject({ addedUsage: 0, duplicates: 2 });
      const response = await summary(); expect(response.headers.get("cache-control")).toContain("no-store");
      const overview = await response.json(); expect(overview.totals.events).toBe(1);
      expect(JSON.stringify(overview)).not.toContain(sample.prompts[0].text);
      const prompts = await promptsRoute(new Request(base + "/api/prompts?q=human", { headers }));
      expect((await prompts.json()).items[0].text).toBe(sample.prompts[0].text);
      const download = await exportRoute(post("/api/export", {}));
      expect(download.headers.get("content-disposition")).toContain("attachment");
      expect((await download.json()).prompts).toEqual([]);
      const included = await exportRoute(post("/api/export", { includePrompts: true }));
      expect((await included.json()).prompts).toHaveLength(1);
      const conflicting = structuredClone(sample); conflicting.usage[0].tokens.input++;
      expect((await importRoute(post("/api/import", { kind: "bundle", bundle: conflicting }))).status).toBe(409);
      expect((await (await summary()).json()).totals.totalTokens).toBe(175);
    } finally { vi.unstubAllEnvs(); rmSync(directory, { recursive: true, force: true }); }
  });
  it("rejects foreign API access and invalid date filters", async () => {
    const foreign = await summaryRoute(new Request(base + "/api/summary", { headers: { ...headers, host: "foreign.example" } }));
    expect(foreign.status).toBe(403);
    const invalid = await summaryRoute(new Request(base + "/api/summary?from=2026-02-30", { headers }));
    expect(invalid.status).toBe(400);
  });
});
