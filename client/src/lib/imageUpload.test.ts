import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateClientImage } from "./imageUpload";

describe("validateClientImage", () => {
  it("allows a supported upload", () => {
    expect(validateClientImage({ type: "image/jpeg", size: 1_024 })).toBeNull();
  });

  it("returns the visible format error for unsupported uploads", () => {
    expect(validateClientImage({ type: "image/gif", size: 1_024 })).toBe(
      "Use a JPG, JPEG, PNG, or WebP image.",
    );
  });

  it("returns the visible size error for oversized images", () => {
    expect(validateClientImage({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 })).toBe(
      "Choose an image smaller than 8 MB.",
    );
  });
});
