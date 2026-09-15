import { describe, it, expect } from "vitest";
import { MAX_FILE_BYTES } from "./schema";
import { assertLocalRequest, readJsonRequest, apiResponse } from "./http";

const headers = { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" };
describe("local HTTP boundary", () => {
  it("accepts same-origin JSON", async () => {
    expect(await readJsonRequest(new Request("http://127.0.0.1:3000/api/import", { method: "POST", headers, body: "{}" }))).toEqual({});
  });
  it.each([
    { ...headers, origin: "https://example.com" },
    { host: headers.host, "content-type": "application/json" },
    { ...headers, host: "evil.example" },
    { ...headers, "sec-fetch-site": "cross-site" },
    { ...headers, "content-type": "text/plain" },
  ])("rejects requests outside the boundary", (badHeaders) => {
    expect(() => assertLocalRequest(new Request("http://127.0.0.1:3000/api/import", { headers: badHeaders }), true)).toThrow();
  });
  it("bounds actual stream bytes without Content-Length", async () => {
    const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_FILE_BYTES)); controller.enqueue(new Uint8Array(1)); controller.close(); } });
    const request = new Request("http://127.0.0.1:3000/api/import", { method: "POST", headers, body, duplex: "half" } as RequestInit);
    await expect(readJsonRequest(request)).rejects.toMatchObject({ status: 413 });
  });
  it("does not echo malformed input or mark errors cacheable", async () => {
    const response = await apiResponse(() => readJsonRequest(new Request("http://127.0.0.1:3000/api/import", { method: "POST", headers, body: "SECRET_PROMPT_NOT_JSON" })));
    expect(response.status).toBe(400); expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).not.toContain("SECRET_PROMPT_NOT_JSON");
  });
});
