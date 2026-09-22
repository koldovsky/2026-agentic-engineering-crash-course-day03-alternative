// @trace FR-CSV-01, FR-CSV-03
import { describe, expect, it, vi } from "vitest";
import { triggerCsvDownload, type CsvDownloadEnv } from "./csv-download";

function fakeAnchor() {
  return { href: "", download: "", click: vi.fn(), remove: vi.fn() };
}

function fakeDocument(anchor: ReturnType<typeof fakeAnchor>) {
  return {
    createElement: () => anchor,
    body: { appendChild: vi.fn() },
  } as unknown as Document;
}

describe("triggerCsvDownload", () => {
  it("builds a text/csv;charset=utf-8 Blob, names the anchor's download attribute, clicks it, and revokes the URL only once the injected timer fires", () => {
    const anchor = fakeAnchor();
    const doc = fakeDocument(anchor);
    let createdBlob: Blob | undefined;
    const revokeObjectURL = vi.fn();
    const timers: Array<() => void> = [];
    const env: CsvDownloadEnv = {
      createObjectURL: (blob) => {
        createdBlob = blob;
        return "blob:fake-url";
      },
      revokeObjectURL,
      document: doc,
      setTimeout: ((fn: () => void) => {
        timers.push(fn);
        return 0;
      }) as unknown as typeof setTimeout,
    };

    triggerCsvDownload("model,total_tokens\r\n", "token-atlas-summary-demo-2026-09-22.csv", env);

    expect(createdBlob).toBeInstanceOf(Blob);
    expect(createdBlob?.type).toBe("text/csv;charset=utf-8");
    expect(anchor.download).toBe("token-atlas-summary-demo-2026-09-22.csv");
    expect(anchor.href).toBe("blob:fake-url");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(anchor.remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    timers[0]?.();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("propagates a thrown error from the injected env (scenario: Download failure surfaces inline)", () => {
    const env: CsvDownloadEnv = {
      createObjectURL: () => {
        throw new Error("createObjectURL is not supported in this browser");
      },
      revokeObjectURL: vi.fn(),
      document: fakeDocument(fakeAnchor()),
      setTimeout: setTimeout,
    };

    expect(() => triggerCsvDownload("model,total_tokens\r\n", "file.csv", env)).toThrow(
      "createObjectURL is not supported in this browser",
    );
  });
});
