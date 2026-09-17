import { describe, expect, it } from "vitest";
import {
  machineImportSettingsForStorage,
  parseSavedMachineImportSettings,
} from "./machine-import-panel";

function savedSettings() {
  return {
    version: 1,
    machine: { id: "test-laptop", label: "Test laptop", member: "Test member" },
    roots: [
      {
        provider: "claude-code",
        path: "C:\\fixtures\\claude\\projects",
        selected: true,
      },
      {
        provider: "codex",
        path: "C:\\fixtures\\codex\\sessions",
        selected: false,
      },
    ],
  };
}

describe("remembered machine import preferences", () => {
  it("restores selected sources and identity but never consent or other stored content", () => {
    const saved = savedSettings();
    const restored = parseSavedMachineImportSettings({
      ...saved,
      includePrompts: true,
      promptText: "This must not become a remembered request.",
      machine: {
        ...saved.machine,
        label: " Test laptop ",
        member: " Test member ",
        includePrompts: true,
      },
      roots: saved.roots.map((root) => ({ ...root, includePrompts: true })),
    });
    expect(restored).toEqual({ machine: saved.machine, roots: saved.roots });
    expect(JSON.stringify(restored)).not.toContain("includePrompts");
    expect(JSON.stringify(restored)).not.toContain("promptText");
  });

  it.each([
    null,
    {},
    { ...savedSettings(), version: 2 },
    { ...savedSettings(), roots: [] },
    {
      ...savedSettings(),
      roots: [savedSettings().roots[0], savedSettings().roots[0]],
    },
  ])("discards missing, obsolete or inconsistent preferences", (saved) => {
    expect(parseSavedMachineImportSettings(saved)).toBeNull();
  });

  it.each([
    "relative/folder",
    "C:drive-relative",
    "\\\\server\\share\\logs",
    "//server/share/logs",
    "C:\\bad\u0000path",
    "",
  ])("rejects a nonlocal or invalid root: %s", (path) => {
    const saved = savedSettings();
    saved.roots[0].path = path;
    expect(parseSavedMachineImportSettings(saved)).toBeNull();
  });

  it("accepts local Unix folders and preserves an intentionally unselected source", () => {
    const saved = savedSettings();
    saved.roots[0].path = "/tmp/fixtures/claude/projects";
    saved.roots[1].path = "/tmp/fixtures/codex/sessions";
    expect(parseSavedMachineImportSettings(saved)?.roots).toEqual(saved.roots);
  });

  it("remembers a deselection after clearing its folder without changing the draft", () => {
    const settings = parseSavedMachineImportSettings(savedSettings())!;
    const lastPath = settings.roots[1].path;
    settings.roots[1].path = "";
    const stored = machineImportSettingsForStorage(settings, {
      codex: lastPath,
    });
    expect(stored?.roots[1]).toEqual({
      provider: "codex",
      path: lastPath,
      selected: false,
    });
    expect(settings.roots[1].path).toBe("");
    expect(
      parseSavedMachineImportSettings({ version: 1, ...stored })?.roots[1]
        .selected,
    ).toBe(false);
  });

  it("never substitutes a previous path for an invalid selected folder", () => {
    const settings = parseSavedMachineImportSettings(savedSettings())!;
    const previousPath = settings.roots[0].path;
    settings.roots[0].path = "relative/folder";
    expect(
      machineImportSettingsForStorage(settings, {
        "claude-code": previousPath,
      }),
    ).toBeNull();
  });

  it("keeps a valid newly entered folder instead of its saved fallback", () => {
    const settings = parseSavedMachineImportSettings(savedSettings())!;
    expect(
      machineImportSettingsForStorage(settings, {
        codex: "C:\\old-fixtures\\codex",
      })?.roots[1],
    ).toEqual(settings.roots[1]);
  });

  it.each([
    { id: "bad id", label: "Test", member: "Test" },
    { id: "valid", label: " ", member: "Test" },
    { id: "valid", label: "Test", member: "Test\nInjected" },
  ])("discards invalid identities so defaults can be used", (machine) => {
    expect(
      parseSavedMachineImportSettings({ ...savedSettings(), machine }),
    ).toBeNull();
  });
});
