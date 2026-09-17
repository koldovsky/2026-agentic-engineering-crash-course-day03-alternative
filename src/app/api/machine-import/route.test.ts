import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const base = "http://127.0.0.1:3000";
const headers = {
  host: "127.0.0.1:3000",
  origin: base,
  "content-type": "application/json",
};
const machine = {
  id: "synthetic-route",
  label: "Route computer",
  member: "Test member",
};
const body = {
  machine,
  roots: [
    {
      provider: "claude-code",
      path: resolve("samples/machine-import/claude/projects"),
    },
  ],
};
let directory: string;
let database: string;
function post(
  input: unknown,
  requestHeaders: Record<string, string> = headers,
) {
  return POST(
    new Request(base + "/api/machine-import", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(input),
    }),
  );
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "token-atlas-machine-route-"));
  database = join(directory, "test.sqlite");
  vi.stubEnv("TOKEN_ATLAS_DB", database);
  vi.stubEnv("CLAUDE_CONFIG_DIR", join(directory, "claude"));
  vi.stubEnv("CODEX_HOME", join(directory, "codex"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});

describe("machine import API", () => {
  it("returns uncached metadata defaults without creating the ledger", async () => {
    const response = await GET(
      new Request(base + "/api/machine-import", { headers }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await response.json()).roots[1].path).toBe(
      join(directory, "codex", "sessions"),
    );
    expect(existsSync(database)).toBe(false);
  });
  it("imports synthetic usage through the guarded route and counts repeats", async () => {
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "imported",
      addedUsage: 1,
      addedPrompts: 0,
      partial: false,
    });
    const repeated = await post(body);
    expect(await repeated.json()).toMatchObject({
      addedUsage: 0,
      duplicates: 1,
    });
    const conflict = await post({
      ...body,
      machine: { ...machine, member: "Other member" },
    });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error).toContain("attribution");
  });
  it("rejects foreign/defaults origins, missing mutation origin and unsupported requests before persistence", async () => {
    for (const foreign of [
      { ...headers, host: "other.example" },
      { ...headers, origin: "https://other.example" },
      { ...headers, "sec-fetch-site": "cross-site" },
    ]) {
      expect(
        (
          await GET(
            new Request(base + "/api/machine-import", { headers: foreign }),
          )
        ).status,
      ).toBe(403);
      expect((await post(body, foreign)).status).toBe(403);
    }
    expect(
      (
        await post(body, {
          host: headers.host,
          "content-type": "application/json",
        })
      ).status,
    ).toBe(403);
    expect(
      (await post(body, { ...headers, "content-type": "text/plain" })).status,
    ).toBe(415);
    expect(
      (
        await post({
          ...body,
          roots: [{ provider: "codex", path: "relative" }],
        })
      ).status,
    ).toBe(400);
    expect((await post({ ...body, unexpected: true })).status).toBe(400);
    expect(existsSync(database)).toBe(false);
  });
});
