import { describe, expect, it } from "vitest";
import { isSupportedResultSource, validateEditOptions, validateImageUpload } from "./imageRemoval";

describe("validateImageUpload", () => {
  it("accepts a supported image inside the size limit", () => {
    expect(
      validateImageUpload({
        fileName: "portrait.webp",
        mimeType: "image/webp",
        byteLength: 1_024,
      }),
    ).toEqual({ valid: true, extension: ".webp" });
  });

  it("rejects unsupported file formats", () => {
    expect(
      validateImageUpload({
        fileName: "document.pdf",
        mimeType: "application/pdf",
        byteLength: 1_024,
      }),
    ).toEqual({ valid: false, message: "Use a JPG, JPEG, PNG, or WebP image." });
  });

  it("rejects images over the upload size limit", () => {
    expect(
      validateImageUpload({
        fileName: "large.png",
        mimeType: "image/png",
        byteLength: 8 * 1024 * 1024 + 1,
      }),
    ).toEqual({ valid: false, message: "Choose an image smaller than 8 MB." });
  });
});

describe("validateEditOptions", () => {
  const validOptions = {
    cropZoom: 1.2,
    cropX: 10,
    cropY: -10,
    shadowEnabled: true,
    shadowOpacity: 55,
    shadowBlur: 16,
    shadowOffsetY: 12,
    backgroundColor: "transparent",
    exportSize: "original",
    exportFormat: "png",
    exportQuality: 92,
  };

  it("accepts supported crop and shadow values", () => {
    expect(validateEditOptions(validOptions)).toMatchObject({ valid: true, options: validOptions });
  });

  it("rejects crop settings outside the supported range", () => {
    expect(validateEditOptions({ ...validOptions, cropZoom: 2 })).toEqual({
      valid: false,
      message: "One of the edit controls is outside its supported range.",
    });
  });

  it("rejects arbitrary background colors instead of allowing unvalidated color input", () => {
    expect(validateEditOptions({ ...validOptions, backgroundColor: "#badba" })).toEqual({
      valid: false,
      message: "Choose a preset or valid six-digit hexadecimal background color.",
    });
  });

  it("accepts six-digit custom hex colors and rejects unsupported export sizes", () => {
    expect(validateEditOptions({ ...validOptions, backgroundColor: "#123abc" })).toMatchObject({ valid: true });
    expect(validateEditOptions({ ...validOptions, exportSize: "wallpaper" })).toEqual({
      valid: false,
      message: "Choose one of the available export sizes.",
    });
  });

  it("validates format selection and compression quality", () => {
    expect(validateEditOptions({ ...validOptions, exportFormat: "webp", exportQuality: 76 })).toMatchObject({ valid: true });
    expect(validateEditOptions({ ...validOptions, exportFormat: "gif" })).toEqual({
      valid: false,
      message: "Choose PNG, JPEG, or WebP for the export format.",
    });
    expect(validateEditOptions({ ...validOptions, exportQuality: 25 })).toEqual({
      valid: false,
      message: "Choose an export quality between 40 and 100.",
    });
  });
});

describe("isSupportedResultSource", () => {
  it("accepts managed storage paths and standalone inline PNG sources", () => {
    expect(isSupportedResultSource("/manus-storage/background-remover/sample.png")).toBe(true);
    expect(isSupportedResultSource("data:image/png;base64,aGVsbG8=")).toBe(true);
  });

  it("rejects arbitrary remote URLs", () => {
    expect(isSupportedResultSource("https://example.com/image.png")).toBe(false);
  });
});
