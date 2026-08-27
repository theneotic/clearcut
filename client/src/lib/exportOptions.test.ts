import { describe, expect, it } from "vitest";
import { normalizeHexColor } from "./exportOptions";

describe("normalizeHexColor", () => {
  it("normalizes short and long hex color values", () => {
    expect(normalizeHexColor("e84")).toBe("#ee8844");
    expect(normalizeHexColor("#E84D31")).toBe("#e84d31");
  });

  it("rejects values that cannot safely be passed to the export processor", () => {
    expect(normalizeHexColor("red")).toBeNull();
    expect(normalizeHexColor("#12345")).toBeNull();
  });
});
