import { describe, expect, it } from "vitest";
import { buttonClassName } from "../src/components/Button";

describe("buttonClassName", () => {
  it("includes the base button classes and caller classes", () => {
    expect(buttonClassName("w-full")).toContain("w-full");
    expect(buttonClassName("w-full")).toContain("inline-flex");
  });
});
