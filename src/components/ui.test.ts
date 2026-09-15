import { describe, expect, it } from "vitest";
import { modelName } from "./ui";

describe("model labels", () => {
  it.each(["__proto__", "constructor", "toString", "unlisted-model"])(
    "renders unknown model %s as its literal identifier",
    (model) => expect(modelName(model)).toBe(model),
  );

  it("uses a friendly label for a recognized identifier", () => {
    expect(modelName("claude-sonnet-4-6")).toBe("Claude Sonnet 4.6");
  });
});
